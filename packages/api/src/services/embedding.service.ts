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
 * Serviço de Ingestão de Documentos (Embedding) — v4 (Chunking Semântico Adaptativo).
 *
 * Pipeline:
 *   1. Extração multi-formato (PDF, Word, Excel, Imagem/OCR, TXT, Markdown)
 *   2. Sanitização (remove cabeçalhos IFMG, anexos, artefatos de OCR)
 *   3. Roteamento por tipo de documento → estratégia de chunking
 *   4. Chunking semântico (jurídico | tabela | geral)
 *   5. Injeção de contexto global (prefixo com nome do documento e seção)
 *   6. Vetorização (bge-m3, 1024d) e gravação (PostgreSQL + pgvector)
 *
 * Melhorias em relação à v3:
 *   - Chunking Jurídico: quebra por Art./CAPÍTULO/TÍTULO/Seção (preserva artigo+incisos)
 *   - Chunking de Tabelas: nunca quebra no meio de uma linha; replica cabeçalho
 *   - Contexto Global: cada chunk recebe prefixo [Documento: X | Contexto: Y]
 *   - Roteamento automático: detecta tipo pelo conteúdo (não apenas pelo filename)
 */

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/**
 * Limite máximo de caracteres enviados ao Ollama por chamada de embedding.
 * Última linha de defesa contra "input length exceeds context length".
 *
 * bge-m3 suporta 8192 tokens. Usando margem conservadora:
 * (8192 - 200 margem) × 4 chars/token ≈ 32000 → arredondado para 4000 (seguro).
 */
const EMBEDDING_MAX_CHARS = 4000;

/**
 * Tamanho alvo para chunks de texto geral (em caracteres).
 * ~512 tokens × 4 chars/token = 2048.
 */
const CHUNK_SIZE_GERAL = 2048;

/** Overlap entre chunks de texto geral (em caracteres). */
const CHUNK_OVERLAP_GERAL = 256;

/** Máximo de linhas de tabela por chunk antes de subdividir. */
const TABELA_MAX_LINHAS_POR_CHUNK = 30;

/** Instância do extrator PDF (reutilizável) */
const pdfExtract = new PDFExtract();

/** Tamanho do lote de vetorização em paralelo. */
const BATCH_SIZE = 32;

// ===========================================================================
// ETAPA 1 — EXTRAÇÃO DE TEXTO (Multi-formato)
// ===========================================================================

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

  if (mimetype === "text/plain" || mimetype === "text/markdown" || nomeLower.endsWith(".txt") || nomeLower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Formato não suportado: ${mimetype}`);
}

// ===========================================================================
// ETAPA 2 — ROTEAMENTO E CHUNKING SEMÂNTICO ADAPTATIVO
// ===========================================================================

// ---------------------------------------------------------------------------
// 2.0 — Utilitários de Contexto
// ---------------------------------------------------------------------------

/**
 * Gera um nome legível do documento a partir do filename.
 * Remove extensão e substitui underscores/hifens por espaços.
 *
 * Ex: "Regulamento_TCC_2024.pdf" → "Regulamento TCC 2024"
 */
function gerarNomeDocumento(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")     // Remove extensão
    .replace(/[_-]+/g, " ")      // Underscores e hifens → espaço
    .replace(/\s{2,}/g, " ")     // Colapsa espaços múltiplos
    .trim();
}

/**
 * Injeta o prefixo de contexto global no conteúdo de um chunk.
 *
 * O prefixo fornece ao modelo de embedding e ao LLM informações sobre
 * de onde aquele trecho veio, evitando o problema de Out of Context (OOC).
 *
 * Formato:
 *   [Documento: Regulamento de TCC | Contexto: CAPÍTULO II - Do Estágio]
 *
 *   {texto_do_chunk}
 */
function injetarContexto(
  texto: string,
  nomeDocumento: string,
  contextoSecao: string
): string {
  const partes = [`Documento: ${nomeDocumento}`];
  if (contextoSecao) {
    partes.push(`Contexto: ${contextoSecao}`);
  }
  return `[${partes.join(" | ")}]\n\n${texto}`;
}

// ---------------------------------------------------------------------------
// 2.1 — Detecção do Tipo de Documento (Roteamento)
// ---------------------------------------------------------------------------

/** Tipos possíveis de estratégia de chunking */
type TipoChunking = "juridico" | "tabela" | "geral";

/**
 * Detecta a natureza do texto para decidir a estratégia de chunking.
 *
 * Prioridade:
 *   1. Tabela markdown (pipes "|---|") → chunking de tabela
 *   2. Marcadores jurídicos (Art., CAPÍTULO, Seção) → chunking jurídico
 *   3. Default → chunking de texto geral
 *
 * A detecção é feita pelo CONTEÚDO (não apenas pelo filename) para
 * funcionar corretamente com qualquer nome de arquivo.
 */
function detectarTipoChunking(texto: string, filename: string): TipoChunking {
  // 1. Detecção de tabelas por conteúdo: contagem de pipes e separadores markdown
  const separadoresTabela = (texto.match(/\|[\s-]+\|/g) || []).length;
  const linhasComPipe = (texto.match(/^\|.+\|$/gm) || []).length;
  if (separadoresTabela >= 1 && linhasComPipe >= 5) {
    return "tabela";
  }

  // 2. Detecção jurídica por conteúdo: presença de artigos e capítulos
  const artigos = (texto.match(/\bArt\.\s+\d+/g) || []).length;
  const capitulos = (texto.match(/\bCAP[IÍ]TULO\s+[IVXLCDM\d]+/gi) || []).length;
  if (artigos >= 3 || capitulos >= 2) {
    return "juridico";
  }

  // 3. Detecção jurídica por nome do arquivo (fallback)
  if (/regulament|norma|resolu[çc]|portaria|edital|delibera|estatut|regimento/i.test(filename)) {
    return "juridico";
  }

  return "geral";
}

// ---------------------------------------------------------------------------
// 2.2 — Chunking Jurídico
// ---------------------------------------------------------------------------

/**
 * Divide texto jurídico preservando a hierarquia legal completa.
 *
 * Regra principal: um chunk = um Artigo inteiro (com §, incisos I/II/III, alíneas a/b/c).
 * A quebra ocorre SOMENTE antes de: Art., CAPÍTULO, TÍTULO, Seção.
 *
 * Cada seção estrutural (CAPÍTULO, TÍTULO, Seção) é rastreada para injeção
 * de contexto global no prefixo do chunk.
 *
 * Se um artigo individual exceder EMBEDDING_MAX_CHARS, é subdividido
 * usando subdividirBloco() como fallback de segurança.
 */
function chunkingJuridico(texto: string, filename: string): ChunkData[] {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks: ChunkData[] = [];

  // Divide o texto nos pontos estruturais (preservando o delimitador)
  // Regex: quebra ANTES de Art., CAPÍTULO, TÍTULO, Seção (com lookbehind de \n\n)
  const secoes = texto.split(/(?=\n?\n?(?:Art\.\s|CAP[IÍ]TULO\s|T[IÍ]TULO\s|Se[cç][aã]o\s))/i);

  // Rastreia o contexto atual (último CAPÍTULO/TÍTULO/Seção encontrado)
  let contextoAtual = "";

  for (const secao of secoes) {
    const secaoTrimmed = secao.trim();
    if (secaoTrimmed.length === 0) continue;

    // Atualiza contexto se a seção começa com um marcador de hierarquia
    const matchHierarquia = secaoTrimmed.match(
      /^(CAP[IÍ]TULO\s+[IVXLCDM\d]+[\s\S]*?(?:\n|$))/i
    );
    if (matchHierarquia) {
      // Extrai a primeira linha do CAPÍTULO como contexto
      contextoAtual = matchHierarquia[1].split("\n")[0].trim();
    }

    const matchTitulo = secaoTrimmed.match(
      /^(T[IÍ]TULO\s+[IVXLCDM\d]+[\s\S]*?(?:\n|$))/i
    );
    if (matchTitulo) {
      contextoAtual = matchTitulo[1].split("\n")[0].trim();
    }

    const matchSecao = secaoTrimmed.match(
      /^(Se[cç][aã]o\s+[IVXLCDM\d]+[\s\S]*?(?:\n|$))/i
    );
    if (matchSecao) {
      contextoAtual = matchSecao[1].split("\n")[0].trim();
    }

    // Subdivide se exceder o limite de embedding
    const partes = subdividirBloco(secaoTrimmed, EMBEDDING_MAX_CHARS);

    for (const parte of partes) {
      if (parte.trim().length === 0) continue;

      const conteudoComContexto = injetarContexto(parte, nomeDocumento, contextoAtual);

      chunks.push({
        conteudo: conteudoComContexto,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0, // preenchido depois
          nomeDocumento,
          tipoChunking: "juridico",
          contextoSecao: contextoAtual,
        },
      });
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// 2.3 — Chunking de Tabelas
// ---------------------------------------------------------------------------

/**
 * Divide tabelas markdown sem quebrar linhas (rows) no meio.
 *
 * Regra principal: a quebra NUNCA ocorre dentro de uma linha da tabela.
 * Se a tabela for muito grande, divide em blocos de TABELA_MAX_LINHAS_POR_CHUNK
 * linhas, e REPLICA o cabeçalho (primeira linha + separador) no topo de
 * cada chunk subsequente para que o LLM não perca o significado das colunas.
 *
 * Cada chunk recebe o prefixo de contexto global.
 */
function chunkingTabela(texto: string, filename: string): ChunkData[] {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks: ChunkData[] = [];

  // Separa o texto em blocos: tabelas (linhas com pipes) e texto entre tabelas
  const blocos = separarBlocosTabela(texto);

  for (const bloco of blocos) {
    if (bloco.tipo === "texto") {
      // Texto entre tabelas → chunking geral
      const subChunks = chunkingGeral(bloco.conteudo, filename, "tabela");
      chunks.push(...subChunks);
      continue;
    }

    // ── Bloco de tabela ──
    const linhas = bloco.conteudo.split("\n").filter((l) => l.trim().length > 0);
    if (linhas.length === 0) continue;

    // Extrai cabeçalho (primeira linha + separador "| --- |")
    let cabecalho = "";
    let linhasDados: string[] = [];

    if (linhas.length >= 2 && /^\|[\s\-:|]+\|/.test(linhas[1])) {
      cabecalho = linhas[0] + "\n" + linhas[1];
      linhasDados = linhas.slice(2);
    } else {
      linhasDados = linhas;
    }

    // Se a tabela cabe inteira em um chunk, não subdivide
    if (linhasDados.length <= TABELA_MAX_LINHAS_POR_CHUNK) {
      const conteudo = injetarContexto(bloco.conteudo.trim(), nomeDocumento, "Tabela/Matriz");

      chunks.push({
        conteudo,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          nomeDocumento,
          tipoChunking: "tabela",
          contextoSecao: "Tabela/Matriz",
        },
      });
      continue;
    }

    // ── Subdivide a tabela replicando o cabeçalho ──
    for (let i = 0; i < linhasDados.length; i += TABELA_MAX_LINHAS_POR_CHUNK) {
      const fatia = linhasDados.slice(i, i + TABELA_MAX_LINHAS_POR_CHUNK);
      const parteNum = Math.floor(i / TABELA_MAX_LINHAS_POR_CHUNK) + 1;
      const totalPartes = Math.ceil(linhasDados.length / TABELA_MAX_LINHAS_POR_CHUNK);
      const contexto = `Tabela/Matriz (parte ${parteNum}/${totalPartes})`;

      // Replica cabeçalho no topo de cada sub-chunk
      const tabelaChunk = cabecalho
        ? `${cabecalho}\n${fatia.join("\n")}`
        : fatia.join("\n");

      const conteudo = injetarContexto(tabelaChunk, nomeDocumento, contexto);

      chunks.push({
        conteudo,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          nomeDocumento,
          tipoChunking: "tabela",
          contextoSecao: contexto,
        },
      });
    }
  }

  return chunks;
}

/** Tipos de bloco ao separar tabelas de texto */
interface BlocoTabela {
  tipo: "tabela" | "texto";
  conteudo: string;
}

/**
 * Separa o texto em blocos alternados de tabela e texto corrido.
 * Uma sequência de linhas com pipes ("|") é considerada tabela.
 */
function separarBlocosTabela(texto: string): BlocoTabela[] {
  const linhas = texto.split("\n");
  const blocos: BlocoTabela[] = [];
  let blocoAtual: string[] = [];
  let tipoAtual: "tabela" | "texto" | null = null;

  for (const linha of linhas) {
    const ehLinhaPipe = /^\s*\|.+\|\s*$/.test(linha);
    const tipo: "tabela" | "texto" = ehLinhaPipe ? "tabela" : "texto";

    if (tipoAtual !== null && tipo !== tipoAtual) {
      // Mudou de tipo: salva o bloco anterior
      const conteudo = blocoAtual.join("\n").trim();
      if (conteudo.length > 0) {
        blocos.push({ tipo: tipoAtual, conteudo });
      }
      blocoAtual = [];
    }

    tipoAtual = tipo;
    blocoAtual.push(linha);
  }

  // Último bloco
  if (blocoAtual.length > 0 && tipoAtual !== null) {
    const conteudo = blocoAtual.join("\n").trim();
    if (conteudo.length > 0) {
      blocos.push({ tipo: tipoAtual, conteudo });
    }
  }

  return blocos;
}

// ---------------------------------------------------------------------------
// 2.4 — Chunking de Texto Geral
// ---------------------------------------------------------------------------

/**
 * Divide texto corrido em chunks por fronteiras de parágrafo (\n\n),
 * com tamanho alvo CHUNK_SIZE_GERAL e overlap CHUNK_OVERLAP_GERAL.
 *
 * Usa subdividirBloco() como fallback para parágrafos únicos muito longos.
 * Cada chunk recebe o prefixo de contexto global.
 *
 * @param texto    - Texto sanitizado
 * @param filename - Nome do arquivo original
 * @param tipoOverride - Se fornecido, substitui o tipo no metadata
 */
function chunkingGeral(
  texto: string,
  filename: string,
  tipoOverride?: "tabela" | "geral"
): ChunkData[] {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks: ChunkData[] = [];
  const tipo = tipoOverride || "geral";

  const blocos = texto.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  if (blocos.length === 0) return [];

  let chunkAtual = "";

  for (const bloco of blocos) {
    if (
      chunkAtual.length > 0 &&
      chunkAtual.length + bloco.length > CHUNK_SIZE_GERAL
    ) {
      // Salva o chunk atual, subdividindo se necessário
      for (const parte of subdividirBloco(chunkAtual, EMBEDDING_MAX_CHARS)) {
        const conteudo = injetarContexto(parte.trim(), nomeDocumento, "");

        chunks.push({
          conteudo,
          metadata: {
            filename,
            chunkIndex: chunks.length,
            totalChunks: 0,
            nomeDocumento,
            tipoChunking: tipo,
            contextoSecao: "",
          },
        });
      }

      // Inicia novo chunk com overlap
      const overlap = CHUNK_OVERLAP_GERAL > 0
        ? chunkAtual.slice(-CHUNK_OVERLAP_GERAL)
        : "";
      chunkAtual = overlap + (overlap ? "\n\n" : "") + bloco;
    } else {
      chunkAtual += (chunkAtual.length > 0 ? "\n\n" : "") + bloco;
    }
  }

  // Último chunk
  if (chunkAtual.trim().length > 0) {
    for (const parte of subdividirBloco(chunkAtual, EMBEDDING_MAX_CHARS)) {
      const conteudo = injetarContexto(parte.trim(), nomeDocumento, "");

      chunks.push({
        conteudo,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          nomeDocumento,
          tipoChunking: tipo,
          contextoSecao: "",
        },
      });
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// 2.5 — Subdivisão de Segurança
// ---------------------------------------------------------------------------

/**
 * Subdivide um bloco único longo em pedaços de até `maxChars` caracteres,
 * tentando cortar em limites de frase (". ") ou linha ("\n").
 *
 * Necessário quando um artigo/parágrafo individual excede EMBEDDING_MAX_CHARS.
 * Situação que ocorre em bibliografias densas ou artigos com muitos incisos.
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

// ---------------------------------------------------------------------------
// 2.6 — Orquestrador de Chunking (Roteador)
// ---------------------------------------------------------------------------

/**
 * Ponto de entrada do chunking: detecta o tipo de documento e delega
 * para a estratégia de chunking adequada.
 *
 * Após o chunking, preenche o totalChunks em todos os metadados.
 */
function dividirEmChunks(texto: string, filename: string): ChunkData[] {
  const tipoChunking = detectarTipoChunking(texto, filename);

  console.log(
    `🔀 [Roteamento] "${filename}" → estratégia: ${tipoChunking.toUpperCase()}`
  );

  let chunks: ChunkData[];

  switch (tipoChunking) {
    case "juridico":
      chunks = chunkingJuridico(texto, filename);
      break;
    case "tabela":
      chunks = chunkingTabela(texto, filename);
      break;
    case "geral":
    default:
      chunks = chunkingGeral(texto, filename);
      break;
  }

  // Preenche o totalChunks em todos os metadados
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  console.log(
    `✂️  [Chunking] "${filename}" → ${chunks.length} chunks (tipo: ${tipoChunking})`
  );

  return chunks;
}

// ===========================================================================
// ETAPA 3 — VETORIZAÇÃO E GRAVAÇÃO
// ===========================================================================

/**
 * Trunca o texto para EMBEDDING_MAX_CHARS antes de enviar ao Ollama.
 *
 * Esta é a última linha de defesa: idealmente nunca deve ser atingida se
 * o chunking e subdividirBloco() estiverem corretamente configurados.
 * Ela protege contra casos extremos (ex: prefixo de contexto + texto longo).
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
 * Gera embeddings e grava os chunks no banco de dados em lotes.
 * Processa BATCH_SIZE chunks em paralelo para acelerar a ingestão.
 * A coluna content_tsv é gerada automaticamente pelo PostgreSQL.
 */
async function vetorizarEGravar(chunks: ChunkData[]): Promise<number> {
  let gravados = 0;
  let errosDimensao = 0;
  let outrosErros = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchLabel = `[Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}]`;

    console.log(
      `🔢 [Embedding] ${batchLabel} Processando ${batch.length} chunks em paralelo...`
    );

    const results = await Promise.allSettled(
      batch.map(async (chunk, j) => {
        const idx = i + j;
        const progresso = `[${idx + 1}/${chunks.length}]`;
        const conteudoSeguro = truncarParaEmbedding(chunk.conteudo);

        const embedding = await gerarEmbeddingOllama(conteudoSeguro);
        const vectorStr = `[${embedding.join(",")}]`;

        await pool.query(
          `INSERT INTO documents (content, metadata, embedding)
           VALUES ($1, $2, $3)`,
          [conteudoSeguro, JSON.stringify(chunk.metadata), vectorStr]
        );

        console.log(
          `💾 [Banco] ${progresso} Chunk gravado (${embedding.length} dimensões)`
        );
      })
    );

    // Contabiliza sucessos e loga erros com detalhes
    for (const result of results) {
      if (result.status === "fulfilled") {
        gravados++;
      } else {
        const errMsg = result.reason?.message || String(result.reason);

        // Detectar erro de dimensão incompatível (pgvector CheckExpectedDim)
        if (errMsg.includes("expected") && errMsg.includes("dimensions")) {
          errosDimensao++;
          if (errosDimensao === 1) {
            // Loga apenas na primeira ocorrência para não poluir
            console.error(
              `❌ [Embedding] ERRO DE DIMENSÃO: O banco espera uma dimensão diferente do modelo.\n` +
              `   Detalhe: ${errMsg}\n` +
              `   Solução: Reinicie a API — a auto-migração corrigirá a dimensão.\n` +
              `   Alternativa: Execute manualmente: psql -f migrate_bge_m3.sql`
            );
          }
        } else {
          outrosErros++;
          console.error(`❌ [Embedding] Erro no lote: ${errMsg}`);
        }
      }
    }

    // Se todos os chunks do lote falharam por dimensão, aborta cedo
    if (errosDimensao > 0 && gravados === 0 && i + BATCH_SIZE >= chunks.length) {
      break;
    }
  }

  // Resumo final de erros
  if (errosDimensao > 0 || outrosErros > 0) {
    console.error(
      `\n📊 [Embedding] Resumo: ${gravados} gravados, ${errosDimensao} erros de dimensão, ${outrosErros} outros erros`
    );

    if (errosDimensao > 0) {
      console.error(
        `   💡 A dimensão do embedding no banco está incompatível com o modelo configurado.\n` +
        `   💡 Reinicie a API para auto-migrar, ou execute: psql -U chatifme -d chatifme -f migrate_bge_m3.sql`
      );
    }
  }

  return gravados;
}

// ===========================================================================
// PIPELINE PRINCIPAL — Orquestra o fluxo completo de ingestão
// ===========================================================================

/**
 * Processa um documento completo:
 *   1. Extrai texto (multi-formato)
 *   2. Sanitiza (cabeçalhos IFMG, OCR, anexos)
 *   3. Roteia para estratégia de chunking (jurídico | tabela | geral)
 *   4. Injeta contexto global em cada chunk
 *   5. Vetoriza (bge-m3) e grava (pgvector)
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

  // Etapa 2: Sanitização — remove cabeçalhos IFMG, artefatos de OCR,
  // poda anexos, prepara quebras para chunking jurídico
  const texto = sanitizarTexto(textoRaw);

  // Etapa 3: Chunking semântico adaptativo (com injeção de contexto)
  const chunks = dividirEmChunks(texto, filename);

  // Etapa 4: Vetorizar e gravar (com truncamento de segurança)
  const chunksGravados = await vetorizarEGravar(chunks);

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  const falhas = chunks.length - chunksGravados;

  if (chunksGravados === 0 && chunks.length > 0) {
    // Nenhum chunk gravado — erro grave
    console.error(`\n${"=".repeat(60)}`);
    console.error(
      `❌ [Ingestão] "${filename}" FALHOU em ${duracao}s — 0/${chunks.length} chunks gravados`
    );
    console.error(`${"=".repeat(60)}\n`);

    return {
      mensagem:
        `Falha na ingestão: nenhum chunk foi gravado (0/${chunks.length}). ` +
        `Possível causa: dimensão do embedding incompatível com o banco de dados. ` +
        `Reinicie a API para executar a auto-migração.`,
      arquivo: filename,
      totalChunks: chunks.length,
      chunksGravados: 0,
    };
  }

  console.log(`\n${"=".repeat(60)}`);
  if (falhas > 0) {
    console.warn(
      `⚠️  [Ingestão] "${filename}" concluído com erros em ${duracao}s — ${chunksGravados}/${chunks.length} chunks (${falhas} falhas)`
    );
  } else {
    console.log(
      `✅ [Ingestão] "${filename}" concluído em ${duracao}s — ${chunksGravados}/${chunks.length} chunks`
    );
  }
  console.log(`${"=".repeat(60)}\n`);

  return {
    mensagem: falhas > 0
      ? `Documento processado parcialmente em ${duracao}s. ${falhas} chunk(s) falharam.`
      : `Documento processado com sucesso em ${duracao}s.`,
    arquivo: filename,
    totalChunks: chunks.length,
    chunksGravados,
  };
}

// ===========================================================================
// LISTAGEM E REMOÇÃO DE DOCUMENTOS
// ===========================================================================

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