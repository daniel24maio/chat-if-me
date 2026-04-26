import { PDFExtract } from "pdf.js-extract";
import { createWorker } from "tesseract.js";
import { pool } from "../config/database.js";
import { gerarEmbeddingOllama } from "../config/ollama.js";
import type {
  ChunkData,
  UploadResponse,
} from "../interfaces/embedding.interfaces.js";

/**
 * Serviço de Ingestão de Documentos (Embedding) — v2 (Robusta).
 *
 * Melhorias em relação à v1:
 *   1. Extração com pdf.js-extract (preserva coordenadas x,y para tabelas)
 *   2. OCR via tesseract.js para imagens (PNG, JPEG)
 *   3. Chunking semântico (respeita parágrafos e tabelas, não quebra no meio)
 *   4. Suporte multi-formato: PDF, imagens, texto puro
 */

// ---------------------------------------------------------------------------
// Configuração de chunking
// ---------------------------------------------------------------------------

/** Tamanho alvo de cada chunk em caracteres */
const CHUNK_SIZE = 1500;

/** Sobreposição entre chunks para manter contexto nas bordas */
const CHUNK_OVERLAP = 200;

/** Instância do extrator PDF (reutilizável) */
const pdfExtract = new PDFExtract();

// ---------------------------------------------------------------------------
// Etapa 1 — Extração de Texto (Multi-formato)
// ---------------------------------------------------------------------------

/**
 * Extrai texto de um PDF usando pdf.js-extract.
 *
 * Diferente do pdf-parse, esta lib retorna coordenadas (x, y) de cada
 * item de texto, permitindo reconstruir o layout de tabelas.
 *
 * Estratégia de reconstrução de layout:
 *   1. Agrupar itens por proximidade vertical (mesmo Y ≈ mesma linha)
 *   2. Ordenar itens dentro de cada linha por X (esquerda → direita)
 *   3. Detectar colunas consistentes → formatar como tabela markdown
 *   4. Separar páginas com marcadores para chunking
 */
async function extrairTextoPDF(
  buffer: Buffer,
  filename: string
): Promise<string> {
  console.log(
    `📄 [Extração] Iniciando extração avançada de "${filename}"...`
  );

  const data = await pdfExtract.extractBuffer(buffer);
  const paginas: string[] = [];

  for (let pIdx = 0; pIdx < data.pages.length; pIdx++) {
    const page = data.pages[pIdx];
    const items = page.content;

    if (items.length === 0) continue;

    // Agrupa itens por linha (proximidade no eixo Y)
    const linhas = agruparPorLinhas(items);

    // Detecta se há estrutura tabular (≥3 linhas com ≥2 colunas consistentes)
    const ehTabela = detectarTabela(linhas);

    let textoPage: string;
    if (ehTabela) {
      textoPage = formatarComoTabela(linhas);
      console.log(`   📊 Página ${pIdx + 1}: tabela detectada`);
    } else {
      textoPage = linhas.map((linha) => linha.join(" ")).join("\n");
    }

    paginas.push(`--- Página ${pIdx + 1} ---\n${textoPage}`);
  }

  const textoFinal = paginas.join("\n\n");
  console.log(
    `📄 [Extração] Concluído: ${data.pages.length} páginas, ${textoFinal.length} caracteres`
  );

  return textoFinal;
}

/** Item de texto com coordenadas do pdf.js-extract */
interface TextItem {
  x: number;
  y: number;
  str: string;
  width: number;
  height: number;
}

/**
 * Agrupa itens de texto por proximidade vertical (mesma linha).
 * Threshold: itens com diferença de Y ≤ 3 estão na mesma linha.
 */
function agruparPorLinhas(items: TextItem[]): string[][] {
  if (items.length === 0) return [];

  // Ordena por Y (cima → baixo), depois por X (esquerda → direita)
  const sorted = [...items]
    .filter((it) => it.str.trim().length > 0)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const linhas: string[][] = [];
  let linhaAtual: string[] = [];
  let yAtual = sorted[0]?.y ?? 0;

  for (const item of sorted) {
    if (Math.abs(item.y - yAtual) > 3) {
      // Nova linha
      if (linhaAtual.length > 0) linhas.push(linhaAtual);
      linhaAtual = [];
      yAtual = item.y;
    }
    linhaAtual.push(item.str.trim());
  }

  if (linhaAtual.length > 0) linhas.push(linhaAtual);
  return linhas;
}

/**
 * Detecta se um conjunto de linhas forma uma tabela.
 * Critério: ≥3 linhas consecutivas com o mesmo número de colunas (≥2).
 */
function detectarTabela(linhas: string[][]): boolean {
  if (linhas.length < 3) return false;

  // Conta linhas com ≥2 itens e agrupa por quantidade de colunas
  const colCounts = linhas
    .filter((l) => l.length >= 2)
    .map((l) => l.length);

  if (colCounts.length < 3) return false;

  // Verifica se ≥60% das linhas têm o mesmo número de colunas
  const moda = colCounts
    .sort(
      (a, b) =>
        colCounts.filter((v) => v === b).length -
        colCounts.filter((v) => v === a).length
    )[0];

  const consistentes = colCounts.filter((c) => c === moda).length;
  return consistentes / colCounts.length >= 0.6;
}

/**
 * Formata linhas como tabela markdown para preservar a associação coluna↔valor.
 */
function formatarComoTabela(linhas: string[][]): string {
  if (linhas.length === 0) return "";

  // Header: primeira linha com mais colunas define a estrutura
  const maxCols = Math.max(...linhas.map((l) => l.length));
  const resultado: string[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    // Padroniza para o número de colunas
    while (linha.length < maxCols) linha.push("");
    resultado.push(`| ${linha.join(" | ")} |`);

    // Separador após a primeira linha (header)
    if (i === 0) {
      resultado.push(`| ${linha.map(() => "---").join(" | ")} |`);
    }
  }

  return resultado.join("\n");
}

/**
 * Extrai texto de uma imagem via OCR (tesseract.js).
 *
 * @param buffer - Buffer binário da imagem (PNG, JPEG)
 * @param filename - Nome do arquivo (para logs)
 * @returns Texto extraído via OCR
 */
async function extrairTextoImagem(
  buffer: Buffer,
  filename: string
): Promise<string> {
  console.log(`🔍 [OCR] Iniciando OCR de "${filename}"...`);

  const worker = await createWorker("por");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);

    console.log(
      `🔍 [OCR] Concluído: ${text.length} caracteres extraídos de "${filename}"`
    );

    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Extrai texto de qualquer formato suportado.
 */
async function extrairTexto(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  if (mimetype === "application/pdf") {
    return extrairTextoPDF(buffer, filename);
  }

  if (mimetype.startsWith("image/")) {
    return extrairTextoImagem(buffer, filename);
  }

  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Formato não suportado: ${mimetype}`);
}

// ---------------------------------------------------------------------------
// Etapa 2 — Chunking Semântico
// ---------------------------------------------------------------------------

/**
 * Divide texto em chunks respeitando fronteiras semânticas.
 *
 * Diferente do chunking bruto (slice), este:
 *   1. Divide primeiro por seções naturais (dupla quebra de linha, tabelas)
 *   2. Agrupa blocos pequenos até atingir ~CHUNK_SIZE
 *   3. Nunca quebra uma tabela ou parágrafo no meio
 *   4. Aplica overlap entre chunks
 */
function dividirEmChunks(texto: string, filename: string): ChunkData[] {
  // Divide em blocos por quebras semânticas (parágrafos, seções, tabelas)
  const blocos = texto.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  if (blocos.length === 0) {
    console.warn(`⚠️ [Chunking] Texto vazio em "${filename}"`);
    return [];
  }

  const chunks: ChunkData[] = [];
  let chunkAtual = "";

  for (const bloco of blocos) {
    // Se adicionar este bloco excede o tamanho alvo, salva o chunk atual
    if (
      chunkAtual.length > 0 &&
      chunkAtual.length + bloco.length > CHUNK_SIZE
    ) {
      chunks.push(criarChunk(chunkAtual, filename, chunks.length));

      // Overlap: pega o final do chunk anterior
      const overlap = chunkAtual.slice(-CHUNK_OVERLAP);
      chunkAtual = overlap + "\n\n" + bloco;
    } else {
      chunkAtual += (chunkAtual.length > 0 ? "\n\n" : "") + bloco;
    }
  }

  // Último chunk
  if (chunkAtual.trim().length > 0) {
    chunks.push(criarChunk(chunkAtual, filename, chunks.length));
  }

  // Atualiza totalChunks
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  console.log(
    `✂️  [Chunking] "${filename}" dividido em ${chunks.length} chunks (alvo: ${CHUNK_SIZE}, overlap: ${CHUNK_OVERLAP})`
  );

  return chunks;
}

function criarChunk(
  conteudo: string,
  filename: string,
  index: number
): ChunkData {
  return {
    conteudo: conteudo.trim(),
    metadata: {
      filename,
      chunkIndex: index,
      totalChunks: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Etapa 3 — Vetorização e Gravação
// ---------------------------------------------------------------------------

/**
 * Gera embeddings e grava os chunks no banco de dados.
 * A coluna content_tsv é gerada automaticamente pelo PostgreSQL.
 */
async function vetorizarEGravar(chunks: ChunkData[]): Promise<number> {
  let gravados = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const progresso = `[${i + 1}/${chunks.length}]`;

    try {
      console.log(
        `🔢 [Embedding] ${progresso} Vetorizando: "${chunk.conteudo.substring(0, 40)}..."`
      );
      const embedding = await gerarEmbeddingOllama(chunk.conteudo);
      const vectorStr = `[${embedding.join(",")}]`;

      await pool.query(
        `INSERT INTO documents (content, metadata, embedding)
         VALUES ($1, $2, $3)`,
        [chunk.conteudo, JSON.stringify(chunk.metadata), vectorStr]
      );

      gravados++;
      console.log(
        `💾 [Banco] ${progresso} Chunk gravado (${embedding.length} dimensões)`
      );
    } catch (error) {
      console.error(
        `❌ [Embedding] ${progresso} Erro:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return gravados;
}

// ---------------------------------------------------------------------------
// Função principal — Orquestra o pipeline de ingestão
// ---------------------------------------------------------------------------

/**
 * Processa um documento completo: extrai texto, divide em chunks,
 * gera embeddings e grava no banco.
 */
export async function processarDocumento(
  buffer: Buffer,
  filename: string,
  mimetype: string = "application/pdf"
): Promise<UploadResponse> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 [Ingestão] Processando "${filename}" (${mimetype})`);
  console.log(`${"=".repeat(60)}\n`);

  const inicio = Date.now();

  // Etapa 1: Extrair texto (multi-formato)
  const texto = await extrairTexto(buffer, filename, mimetype);

  if (texto.trim().length === 0) {
    return {
      mensagem: "O arquivo não contém texto extraível.",
      arquivo: filename,
      totalChunks: 0,
      chunksGravados: 0,
    };
  }

  // Etapa 2: Dividir em chunks (semântico)
  const chunks = dividirEmChunks(texto, filename);

  // Etapa 3: Vetorizar e gravar
  const chunksGravados = await vetorizarEGravar(chunks);

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `✅ [Ingestão] "${filename}" concluído em ${duracao}s — ${chunksGravados}/${chunks.length} chunks`
  );
  console.log(`${"=".repeat(60)}\n`);

  return {
    mensagem: `Documento processado com sucesso em ${duracao}s.`,
    arquivo: filename,
    totalChunks: chunks.length,
    chunksGravados,
  };
}

// ---------------------------------------------------------------------------
// Listagem e remoção de documentos
// ---------------------------------------------------------------------------

/**
 * Lista os documentos já processados e gravados no banco.
 * Agrupa por filename e retorna contagem de chunks.
 */
export async function listarDocumentosProcessados(): Promise<
  { filename: string; totalChunks: number; ultimaAtualizacao: string }[]
> {
  try {
    const result = await pool.query(`
      SELECT
        metadata->>'filename' AS filename,
        COUNT(*) AS total_chunks,
        MAX(created_at) AS ultima_atualizacao
      FROM documents
      GROUP BY metadata->>'filename'
      ORDER BY MAX(created_at) DESC
    `);

    return result.rows.map((row) => ({
      filename: row.filename,
      totalChunks: Number(row.total_chunks),
      ultimaAtualizacao: row.ultima_atualizacao,
    }));
  } catch (error) {
    console.error("[Embedding] Erro ao listar documentos:", error);
    return [];
  }
}

/**
 * Remove todos os chunks de um documento pelo nome do arquivo.
 *
 * @param filename - Nome do arquivo original a remover
 * @returns Número de chunks removidos
 */
export async function removerDocumento(filename: string): Promise<number> {
  console.log(`🗑️  [Remoção] Removendo "${filename}" do banco...`);

  const result = await pool.query(
    `DELETE FROM documents WHERE metadata->>'filename' = $1`,
    [filename]
  );

  const removidos = result.rowCount ?? 0;
  console.log(`🗑️  [Remoção] ${removidos} chunks removidos`);
  return removidos;
}
