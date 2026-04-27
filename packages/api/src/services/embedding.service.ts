import { PDFExtract } from "pdf.js-extract";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import xlsx from "xlsx";
import { pool } from "../config/database.js";
import { gerarEmbeddingOllama } from "../config/ollama.js";
import { sanitizarTexto } from "./sanitization.service.js";
import type {
  ChunkData,
  UploadResponse,
} from "../interfaces/embedding.interfaces.js";

/**
 * Serviço de Ingestão de Documentos (Embedding) — v3 (Sanitização).
 *
 * Melhorias em relação à v2:
 *   5. Camada de sanitização entre extração e chunking
 *      - Remove artefatos de PDF: ¶, marcadores de página, separadores
 *      - Converte tabelas markdown em texto corrido (crítico para busca semântica)
 *      - Reconstrói palavras hifenadas entre linhas
 *      - Normaliza espaçamento e remove linhas de ruído puro
 *   6. Chunking ajustado para respeitar o contexto do modelo Ollama
 *      - CHUNK_SIZE reduzido para 600 chars (~150 tokens — seguro para maioria dos modelos)
 *      - subdividirBloco() quebra blocos únicos muito grandes antes do chunking
 *      - truncarParaEmbedding() é a última linha de defesa antes de chamar o Ollama
 */

// ---------------------------------------------------------------------------
// Configuração de chunking
// ---------------------------------------------------------------------------

/**
 * Tamanho alvo de cada chunk em caracteres.
 *
 * Regra de bolso: 1 token ≈ 4 chars em português.
 * Ajuste conforme o modelo configurado em ollama.ts:
 *
 *   nomic-embed-text   → contexto 2048 tokens → CHUNK_SIZE ≤ 600
 *   mxbai-embed-large  → contexto  512 tokens → CHUNK_SIZE ≤ 400
 *   all-minilm         → contexto  256 tokens → CHUNK_SIZE ≤ 200
 */
const CHUNK_SIZE = 600;

/** Sobreposição entre chunks para manter contexto nas bordas */
const CHUNK_OVERLAP = 100;

/**
 * Limite máximo de caracteres enviados ao Ollama por chamada.
 * Última linha de defesa contra o erro 500 "input length exceeds context length".
 *
 * Fórmula: (contexto_tokens_do_modelo - 10) * 4
 * Ex: nomic-embed-text com 2048 tokens → (2048 - 10) * 4 = 8152
 * Usando 2000 como valor conservador e seguro para múltiplos modelos.
 */
const EMBEDDING_MAX_CHARS = 1500;

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

    const linhas = agruparPorLinhas(items);
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

  const sorted = [...items]
    .filter((it) => it.str.trim().length > 0)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const linhas: string[][] = [];
  let linhaAtual: string[] = [];
  let yAtual = sorted[0]?.y ?? 0;

  for (const item of sorted) {
    if (Math.abs(item.y - yAtual) > 3) {
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

  const colCounts = linhas
    .filter((l) => l.length >= 2)
    .map((l) => l.length);

  if (colCounts.length < 3) return false;

  const moda = colCounts.sort(
    (a, b) =>
      colCounts.filter((v) => v === b).length -
      colCounts.filter((v) => v === a).length
  )[0];

  const consistentes = colCounts.filter((c) => c === moda).length;
  return consistentes / colCounts.length >= 0.6;
}

/**
 * Formata linhas como tabela markdown para preservar a associação coluna↔valor.
 * Nota: a sanitização posterior converterá esse markdown em texto corrido,
 * garantindo que códigos e nomes de disciplina fiquem no mesmo texto contínuo.
 */
function formatarComoTabela(linhas: string[][]): string {
  if (linhas.length === 0) return "";

  const maxCols = Math.max(...linhas.map((l) => l.length));
  const resultado: string[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    while (linha.length < maxCols) linha.push("");
    resultado.push(`| ${linha.join(" | ")} |`);
    if (i === 0) {
      resultado.push(`| ${linha.map(() => "---").join(" | ")} |`);
    }
  }

  return resultado.join("\n");
}

/**
 * Extrai texto de uma imagem via OCR (tesseract.js).
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
 * Extrai texto de um documento Word (.docx) usando mammoth.
 */
async function extrairTextoWord(buffer: Buffer, filename: string): Promise<string> {
  console.log(`📝 [Extração] Iniciando extração de documento Word "${filename}"...`);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extrai dados de planilhas (.xls, .xlsx, .csv) convertendo para Markdown Table.
 */
async function extrairTextoPlanilha(buffer: Buffer, filename: string): Promise<string> {
  console.log(`📊 [Extração] Iniciando extração de planilha "${filename}"...`);
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const planilhas: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    if (data.length === 0) continue;

    const result: string[] = [];
    const maxCols = Math.max(...data.map(row => row.length));

    for (let i = 0; i < data.length; i++) {
      const row = data[i] || [];
      while (row.length < maxCols) row.push("");

      const formattedRow = row.map(cell => String(cell ?? "").replace(/[\n\r\|]/g, " ").trim());
      result.push(`| ${formattedRow.join(" | ")} |`);

      if (i === 0) {
        result.push(`| ${formattedRow.map(() => "---").join(" | ")} |`);
      }
    }

    planilhas.push(`--- Planilha: ${sheetName} ---\n${result.join("\n")}`);
  }

  return planilhas.join("\n\n");
}

/**
 * Extrai texto de qualquer formato suportado.
 */
async function extrairTexto(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  const nomeLower = filename.toLowerCase();

  if (mimetype === "application/pdf" || nomeLower.endsWith(".pdf")) {
    return extrairTextoPDF(buffer, filename);
  }

  if (mimetype.startsWith("image/") || nomeLower.match(/\.(png|jpe?g)$/)) {
    return extrairTextoImagem(buffer, filename);
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword" ||
    nomeLower.endsWith(".docx") || nomeLower.endsWith(".doc")
  ) {
    return extrairTextoWord(buffer, filename);
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimetype === "application/vnd.ms-excel" ||
    mimetype === "text/csv" ||
    nomeLower.endsWith(".xlsx") || nomeLower.endsWith(".xls") || nomeLower.endsWith(".csv")
  ) {
    return extrairTextoPlanilha(buffer, filename);
  }

  if (mimetype === "text/plain" || nomeLower.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Formato não suportado: ${mimetype}`);
}



// ---------------------------------------------------------------------------
// Etapa 2 — Chunking Semântico
// ---------------------------------------------------------------------------

/**
 * Subdivide um bloco único longo em pedaços de até `maxChars` caracteres,
 * tentando cortar em limites de frase (". ") ou linha ("\n").
 *
 * Necessário quando um parágrafo/seção inteira excede EMBEDDING_MAX_CHARS —
 * situação que ocorre em bibliografias densas ou seções de ementa longas.
 */
function subdividirBloco(texto: string, maxChars: number): string[] {
  if (texto.length <= maxChars) return [texto];

  const partes: string[] = [];
  let restante = texto;

  while (restante.length > maxChars) {
    // Tenta cortar na última quebra de frase antes do limite
    let corte = restante.lastIndexOf(". ", maxChars);

    if (corte === -1 || corte < maxChars * 0.5) {
      // Não encontrou ponto — corta na última quebra de linha
      corte = restante.lastIndexOf("\n", maxChars);
    }

    if (corte === -1 || corte < maxChars * 0.5) {
      // Último recurso: corta no limite exato
      corte = maxChars;
    } else {
      corte += 1; // inclui o ponto/quebra no final da parte atual
    }

    partes.push(restante.slice(0, corte).trim());
    restante = restante.slice(corte).trim();
  }

  if (restante.length > 0) partes.push(restante);

  return partes;
}

/**
 * Divide texto em chunks respeitando fronteiras semânticas.
 * Garante que nenhum chunk ultrapasse EMBEDDING_MAX_CHARS.
 */
function dividirEmChunks(texto: string, filename: string): ChunkData[] {
  const blocos = texto.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  if (blocos.length === 0) {
    console.warn(`⚠️ [Chunking] Texto vazio em "${filename}"`);
    return [];
  }

  const chunks: ChunkData[] = [];
  let chunkAtual = "";

  for (const bloco of blocos) {
    if (
      chunkAtual.length > 0 &&
      chunkAtual.length + bloco.length > CHUNK_SIZE
    ) {
      // Salva o chunk atual subdividindo se necessário
      for (const parte of subdividirBloco(chunkAtual, EMBEDDING_MAX_CHARS)) {
        chunks.push(criarChunk(parte, filename, chunks.length));
      }

      const overlap = chunkAtual.slice(-CHUNK_OVERLAP);
      chunkAtual = overlap + "\n\n" + bloco;
    } else {
      chunkAtual += (chunkAtual.length > 0 ? "\n\n" : "") + bloco;
    }
  }

  // Último chunk
  if (chunkAtual.trim().length > 0) {
    for (const parte of subdividirBloco(chunkAtual, EMBEDDING_MAX_CHARS)) {
      chunks.push(criarChunk(parte, filename, chunks.length));
    }
  }

  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  console.log(
    `✂️  [Chunking] "${filename}" → ${chunks.length} chunks (alvo: ${CHUNK_SIZE}, overlap: ${CHUNK_OVERLAP}, max: ${EMBEDDING_MAX_CHARS})`
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
 * Trunca o texto para EMBEDDING_MAX_CHARS antes de enviar ao Ollama.
 *
 * Esta é a última linha de defesa: idealmente nunca deve ser atingida se
 * CHUNK_SIZE e subdividirBloco() estiverem corretamente configurados.
 * Ela protege contra casos extremos (ex: um único parágrafo sem quebras).
 */
function truncarParaEmbedding(texto: string): string {
  if (texto.length <= EMBEDDING_MAX_CHARS) return texto;

  console.warn(
    `⚠️ [Embedding] Chunk com ${texto.length} chars excede o limite (${EMBEDDING_MAX_CHARS}). Truncando.`
  );

  const corte = texto.lastIndexOf(". ", EMBEDDING_MAX_CHARS);
  return corte > EMBEDDING_MAX_CHARS * 0.5
    ? texto.slice(0, corte + 1).trim()
    : texto.slice(0, EMBEDDING_MAX_CHARS).trim();
}

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
      const conteudoSeguro = truncarParaEmbedding(chunk.conteudo);

      console.log(
        `🔢 [Embedding] ${progresso} Vetorizando: "${conteudoSeguro.substring(0, 40)}..." (${conteudoSeguro.length} chars)`
      );

      const embedding = await gerarEmbeddingOllama(conteudoSeguro);
      const vectorStr = `[${embedding.join(",")}]`;

      await pool.query(
        `INSERT INTO documents (content, metadata, embedding)
         VALUES ($1, $2, $3)`,
        [conteudoSeguro, JSON.stringify(chunk.metadata), vectorStr]
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
 * Processa um documento completo: extrai texto, sanitiza, divide em chunks,
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
  const textoRaw = await extrairTexto(buffer, filename, mimetype);

  if (textoRaw.trim().length === 0) {
    return {
      mensagem: "O arquivo não contém texto extraível.",
      arquivo: filename,
      totalChunks: 0,
      chunksGravados: 0,
    };
  }

  // Etapa 1.5: Sanitização — remove artefatos de PDF e normaliza o texto
  // para que a busca semântica funcione tanto por código quanto por nome
  const texto = sanitizarTexto(textoRaw);

  // Etapa 2: Dividir em chunks (semântico + subdivisão de segurança)
  const chunks = dividirEmChunks(texto, filename);

  // Etapa 3: Vetorizar e gravar (com truncamento de segurança)
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