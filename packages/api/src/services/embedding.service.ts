import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import xlsx from "xlsx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { LiteParse } from "@llamaindex/liteparse";
import * as fs from "fs";
import * as path from "path";
import { pool } from "../config/database.js";
import { generateOllamaEmbedding } from "../config/ollama.js";
import { sanitizeText } from "./sanitization.service.js";
import type {
  ChunkData,
  UploadResponse,
} from "../interfaces/embedding.interfaces.js";

/**
 * Serviço de Ingestão de Documentos (Embedding) — v6 (LangChain + LiteParse).
 */

const EMBEDDING_MAX_CHARS = 4000;
const CHUNK_SIZE_GENERAL = 2200;
const CHUNK_OVERLAP_GENERAL = 300;
const TABLE_MAX_ROWS_PER_CHUNK = 30;

const BATCH_SIZE = 32;

// ===========================================================================
// ETAPA 1 — EXTRAÇÃO DE TEXTO (Multi-formato com LiteParse)
// ===========================================================================

async function extractTextFromPDF(buffer: Buffer, filename: string): Promise<string> {
  console.log(`📄 [Extração] Iniciando extração avançada com LiteParse em "${filename}"...`);

  // Cria um nome de arquivo temporário único para evitar colisões em concorrência
  const tempFilename = `temp_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const tempPath = path.resolve(tempFilename);

  // Salva o buffer no disco para o motor em Rust do LiteParse atuar
  await fs.promises.writeFile(tempPath, buffer);

  try {
    const parser = new LiteParse();
    const result = await parser.parse(tempPath);

    // Preserva a numeração de página retornada pelo LiteParse inserindo marcadores [[PAG_N]]
    let finalText = "";
    if (result.pages && Array.isArray(result.pages) && result.pages.length > 0) {
      finalText = result.pages
        .map((p) => `\n[[PAG_${p.pageNum}]]\n${p.text || ""}`)
        .join("\n\n");
    } else {
      finalText = result.text || JSON.stringify(result);
    }

    console.log(`📄 [Extração] Concluído via LiteParse: ${finalText.length} caracteres extraídos de "${filename}" (${result.pages?.length ?? 0} páginas)`);
    return finalText;
  } catch (error) {
    console.error(`❌ [Extração] Erro no LiteParse ao processar "${filename}":`, error);
    throw error;
  } finally {
    // Garante a limpeza do arquivo temporário, mesmo em caso de erro
    await fs.promises.unlink(tempPath).catch(() => console.warn(`⚠️ Não foi possível apagar o arquivo temporário: ${tempPath}`));
  }
}

async function extractTextFromImage(buffer: Buffer, filename: string): Promise<string> {
  console.log(`🔍 [OCR] Iniciando OCR de "${filename}"...`);
  const worker = await createWorker("por");
  try {
    const { data: { text } } = await worker.recognize(buffer);
    console.log(`🔍 [OCR] Concluído: ${text.length} caracteres extraídos de "${filename}"`);
    return text;
  } finally {
    await worker.terminate();
  }
}

async function extractTextFromWord(buffer: Buffer, filename: string): Promise<string> {
  console.log(`📝 [Extração] Iniciando extração de documento Word "${filename}"...`);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromSpreadsheet(buffer: Buffer, filename: string): Promise<string> {
  console.log(`📊 [Extração] Iniciando extração de planilha "${filename}"...`);
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const spreadsheets: string[] = [];

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
    spreadsheets.push(`--- Planilha: ${sheetName} ---\n${result.join("\n")}`);
  }
  return spreadsheets.join("\n\n");
}

async function extractText(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const nameLower = filename.toLowerCase();

  if (mimetype === "application/pdf" || nameLower.endsWith(".pdf")) {
    return extractTextFromPDF(buffer, filename);
  }
  if (mimetype.startsWith("image/") || nameLower.match(/\.(png|jpe?g)$/)) {
    return extractTextFromImage(buffer, filename);
  }
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword" ||
    nameLower.endsWith(".docx") || nameLower.endsWith(".doc")
  ) {
    return extractTextFromWord(buffer, filename);
  }
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimetype === "application/vnd.ms-excel" ||
    mimetype === "text/csv" ||
    nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls") || nameLower.endsWith(".csv")
  ) {
    return extractTextFromSpreadsheet(buffer, filename);
  }
  if (mimetype === "text/plain" || mimetype === "text/markdown" || nameLower.endsWith(".txt") || nameLower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Formato não suportado: ${mimetype}`);
}

// ===========================================================================
// ETAPA 2 — ROTEAMENTO E CHUNKING SEMÂNTICO ADAPTATIVO (LangChain)
// ===========================================================================

function generateDocumentName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function injectContext(
  text: string,
  documentName: string,
  sectionContext: string,
  pages?: string,
  sourceUrl?: string
): string {
  const parts = [`Documento: ${documentName}`];
  if (pages) {
    parts.push(`Página: ${pages}`);
  }
  if (sectionContext) {
    parts.push(`Contexto: ${sectionContext}`);
  }
  if (sourceUrl) {
    parts.push(`Link: ${sourceUrl}`);
  }
  return `[${parts.join(" | ")}]\n\n${text}`;
}

/**
 * Extrai os marcadores de página [[PAG_N]] de um trecho, limpa o texto e
 * retorna o intervalo de páginas (ex: "42" ou "42-43") e a última página vista.
 */
function extractPageInfoFromChunk(
  rawPart: string,
  lastKnownPage: string
): { cleanText: string; pages: string; nextLastPage: string } {
  const pageMatches = Array.from(rawPart.matchAll(/\[\[\s*PAG_(\d+)\s*\]\]/gi));
  const pageNums = Array.from(
    new Set(pageMatches.map((m) => Number(m[1])).filter((n) => !Number.isNaN(n) && n > 0))
  ).sort((a, b) => a - b);

  const cleanText = rawPart
    .replace(/\[\[\s*PAG_\d+\s*\]\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (pageNums.length > 0) {
    const first = pageNums[0];
    const last = pageNums[pageNums.length - 1];
    const pages = first === last ? `${first}` : `${first}-${last}`;
    return { cleanText, pages, nextLastPage: `${last}` };
  }

  return { cleanText, pages: lastKnownPage, nextLastPage: lastKnownPage };
}

/**
 * Extrai a primeira URL válida presente no trecho como fallback quando nenhuma
 * sourceUrl explícita foi informada no momento do upload.
 */
function extractUrlFromText(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s)\]>,"']+/i);
  if (!match) return undefined;
  return match[0].replace(/[.;,:!?]+$/, "");
}

type ChunkingType = "normative" | "syllabus" | "table" | "general";

function detectChunkingType(text: string, filename: string): ChunkingType {
  // 1. Tabelas estruturadas em Markdown
  const tableSeparators = (text.match(/\|[\s-]+\|/g) || []).length;
  const pipeLines = (text.match(/^\|.+\|$/gm) || []).length;
  if (tableSeparators >= 1 && pipeLines >= 5) return "table";

  // 2. Ementários e seções de disciplinas (PPC / Ementários)
  const ementasCount = (text.match(/\bEmenta:\s*/gi) || []).length;
  const codigosCount = (text.match(/\bC[oó]digo:\s*(?:OBBG|OBLC|OBLP|[A-Z]{4})/gi) || []).length;
  const nomeDisciplinaCount = (text.match(/\bNome da disciplina:\s*/gi) || []).length;

  if (ementasCount >= 2 || codigosCount >= 2 || (nomeDisciplinaCount >= 2 && ementasCount >= 1)) {
    return "syllabus";
  }

  if (/ementar|ementas/i.test(filename)) {
    return "syllabus";
  }

  // 3. Normas acadêmicas, Resoluções, Portarias, Regulamentos de Ensino, PPC
  const articles = (text.match(/\bArt\.\s+\d+/g) || []).length;
  const chapters = (text.match(/\bCAP[IÍ]TULO\s+[IVXLCDM\d]+/gi) || []).length;
  if (articles >= 3 || chapters >= 2) return "normative";

  if (/regulament|norma|resolu[çc]|portaria|edital|delibera|estatut|regimento|ppc/i.test(filename)) {
    return "normative";
  }

  return "general";
}

/**
 * Estratégia de Chunking para Ementários e Fichas de Disciplina.
 * Garante que Código + Nome + Carga Horária + Ementa + Objetivos + Bibliografia
 * permaneçam integrados no mesmo chunk semântico autônomo e preserva os blocos de Matriz/Período.
 */
async function syllabusChunking(text: string, filename: string, sourceUrl?: string): Promise<ChunkData[]> {
  const documentName = generateDocumentName(filename);
  const chunks: ChunkData[] = [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE_GENERAL,
    chunkOverlap: CHUNK_OVERLAP_GENERAL,
    separators: [
      "\nCódigo:",
      "\nNome da disciplina:",
      "\nDISCIPLINAS OBRIGATÓRIAS",
      "\nDISCIPLINAS OPTATIVAS",
      "\nMatriz Curricular",
      "\n1º Período",
      "\n2º Período",
      "\n3º Período",
      "\n4º Período",
      "\n5º Período",
      "\n6º Período",
      "\n7º Período",
      "\n8º Período",
      "\n9º Período",
      "\n10º Período",
      "\n\n",
      "\n",
      ". ",
      " "
    ],
    keepSeparator: true
  });

  const parts = await splitter.splitText(text);
  let currentDiscipline = "";
  let currentPeriod = "";
  let lastPage = "";

  for (const part of parts) {
    const { cleanText: partTrimmed, pages, nextLastPage } = extractPageInfoFromChunk(part, lastPage);
    lastPage = nextLastPage;
    if (partTrimmed.length === 0) continue;

    // Detecta seção de período no chunk (ex: "1º Período", "7º Período", "PERÍODO")
    const periodMatch = partTrimmed.match(/(?:^|\n|\b)(\d{1,2}[oOºª]?\s*Per[íi]odo)\b/i);
    if (periodMatch) {
      currentPeriod = periodMatch[1].trim();
    }

    const hasExplicitSyllabusFields = /\b(?:Ementa|Conte[uú]do\s+Program[aá]tico|Bibliografia\s+B[aá]sica):\s*/i.test(partTrimmed)
      || /\b(?:C[oó]digo|Nome da disciplina):\s*/i.test(partTrimmed);
    const distinctCourseCodes = new Set(
      (partTrimmed.match(/\b(?:OBBG|OBL)[A-Z]{2,6}\.\d{3}\b/gi) || []).map((c) => c.toUpperCase())
    );
    const isMatrixOrPeriodList =
      !hasExplicitSyllabusFields &&
      (Boolean(periodMatch) ||
        /PER[IÍ]ODO\s+COD\.?\s+DISCIPLINA|Matriz\s+Curricular/i.test(partTrimmed) ||
        distinctCourseCodes.size >= 2);

    if (isMatrixOrPeriodList) {
      // Se é tabela de matriz curricular ou listagem de período, não contamina com disciplina individual
      currentDiscipline = "";
    } else {
      // Busca código/nome de disciplina para fichas de ementa
      const codeMatchFull = partTrimmed.match(/\bC[oó]digo:\s*([A-Za-z]{3,}[\w._-]*\d{3})/i)
        || partTrimmed.match(/\bNome da disciplina:\s*([^\n]+)/i)
        || (hasExplicitSyllabusFields ? partTrimmed.match(/\b((?:OBBG|OBL)[A-Z]{2,6}\.\d{3})\b/) : null);

      if (codeMatchFull) {
        const nameMatch = partTrimmed.match(/Nome da disciplina:\s*([^\n]+)/i);
        const codeOnlyMatch = partTrimmed.match(/\bC[oó]digo:\s*([A-Za-z0-9._-]+)/i)
          || partTrimmed.match(/\b((?:OBBG|OBL)[A-Z]{2,6}\.\d{3})\b/);

        const code = codeOnlyMatch ? codeOnlyMatch[1].trim() : "";
        const name = nameMatch ? nameMatch[1].trim() : "";
        if (name || code) {
          currentDiscipline = [name, code].filter(Boolean).join(" ");
        }
      }
    }

    // Determina contexto: listagem de período/matriz > disciplina específica > fallback Ementário
    let context: string;
    if (isMatrixOrPeriodList) {
      const allPeriodsInChunk = Array.from(
        new Set(
          Array.from(partTrimmed.matchAll(/\b(\d{1,2}[oOºª]?\s*Per[íi]odo)\b/gi)).map((m) => m[1].trim())
        )
      );
      if (allPeriodsInChunk.length > 0) {
        context = `Grade Curricular — ${allPeriodsInChunk.join(", ")}`;
      } else if (currentPeriod) {
        context = `Grade Curricular — ${currentPeriod}`;
      } else {
        context = "Matriz Curricular";
      }
    } else if (currentDiscipline) {
      context = `Disciplina: ${currentDiscipline}`;
    } else if (currentPeriod) {
      context = `Grade Curricular — ${currentPeriod}`;
    } else {
      context = "Ementário";
    }

    const effectiveUrl = sourceUrl || extractUrlFromText(partTrimmed);
    const contentWithContext = injectContext(partTrimmed, documentName, context, pages || undefined, effectiveUrl);

    chunks.push({
      content: contentWithContext,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        documentName,
        chunkingType: "syllabus",
        sectionContext: context,
        ...(pages ? { pages } : {}),
        ...(effectiveUrl ? { sourceUrl: effectiveUrl } : {}),
      },
    });
  }

  return chunks;
}

/**
 * Estratégia de Chunking para Regulamentos e Normas Acadêmicas (Artigos/Capítulos).
 */
async function normativeChunking(text: string, filename: string, sourceUrl?: string): Promise<ChunkData[]> {
  const documentName = generateDocumentName(filename);
  const chunks: ChunkData[] = [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE_GENERAL,
    chunkOverlap: CHUNK_OVERLAP_GENERAL,
    separators: [
      "\nCAPÍTULO ",
      "\nTÍTULO ",
      "\nSeção ",
      "\nArt. ",
      "\nMatriz Curricular",
      "\nDISCIPLINAS OBRIGATÓRIAS",
      "\nPERÍODO ",
      "\n\n",
      "\n",
      ". ",
      " "
    ],
    keepSeparator: true
  });

  const parts = await splitter.splitText(text);
  let currentContext = "";
  let lastPage = "";

  for (const part of parts) {
    const { cleanText: partTrimmed, pages, nextLastPage } = extractPageInfoFromChunk(part, lastPage);
    lastPage = nextLastPage;
    if (partTrimmed.length === 0) continue;

    const hierarchyMatch = partTrimmed.match(/^(?:CAP[IÍ]TULO|T[IÍ]TULO|Se[cç][aã]o|Art\.\s+\d+º?)\s+[IVXLCDM\d\w\s]+.*?(?:\n|$)/i);
    if (hierarchyMatch) {
      currentContext = hierarchyMatch[0].trim();
    }

    const effectiveUrl = sourceUrl || extractUrlFromText(partTrimmed);
    const contentWithContext = injectContext(partTrimmed, documentName, currentContext, pages || undefined, effectiveUrl);

    chunks.push({
      content: contentWithContext,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        documentName,
        chunkingType: "normative",
        sectionContext: currentContext,
        ...(pages ? { pages } : {}),
        ...(effectiveUrl ? { sourceUrl: effectiveUrl } : {}),
      },
    });
  }

  return chunks;
}

async function tableChunking(text: string, filename: string, sourceUrl?: string): Promise<ChunkData[]> {
  const documentName = generateDocumentName(filename);
  const chunks: ChunkData[] = [];
  const blocks = separateTableBlocks(text);
  let lastPage = "";

  for (const block of blocks) {
    if (block.type === "texto") {
      const subChunks = await generalChunking(block.content, filename, "table", sourceUrl, lastPage);
      if (subChunks.length > 0) {
        const lastSubPages = subChunks[subChunks.length - 1]?.metadata.pages;
        if (lastSubPages) lastPage = lastSubPages.split("-").pop() || lastPage;
      }
      chunks.push(...subChunks);
      continue;
    }

    const { cleanText: cleanBlockContent, pages, nextLastPage } = extractPageInfoFromChunk(block.content, lastPage);
    lastPage = nextLastPage;
    const lines = cleanBlockContent.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    let header = "";
    let dataLines: string[] = [];

    if (lines.length >= 2 && /^\|[\s\-:|]+\|/.test(lines[1])) {
      header = lines[0] + "\n" + lines[1];
      dataLines = lines.slice(2);
    } else {
      dataLines = lines;
    }

    if (dataLines.length <= TABLE_MAX_ROWS_PER_CHUNK) {
      const effectiveUrl = sourceUrl || extractUrlFromText(cleanBlockContent);
      const content = injectContext(cleanBlockContent.trim(), documentName, "Tabela/Matriz", pages || undefined, effectiveUrl);
      chunks.push({
        content,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          documentName,
          chunkingType: "table",
          sectionContext: "Tabela/Matriz",
          ...(pages ? { pages } : {}),
          ...(effectiveUrl ? { sourceUrl: effectiveUrl } : {}),
        },
      });
      continue;
    }

    for (let i = 0; i < dataLines.length; i += TABLE_MAX_ROWS_PER_CHUNK) {
      const slice = dataLines.slice(i, i + TABLE_MAX_ROWS_PER_CHUNK);
      const partNum = Math.floor(i / TABLE_MAX_ROWS_PER_CHUNK) + 1;
      const totalPartes = Math.ceil(dataLines.length / TABLE_MAX_ROWS_PER_CHUNK);
      const context = `Tabela/Matriz (parte ${partNum}/${totalPartes})`;

      const tableChunk = header ? `${header}\n${slice.join("\n")}` : slice.join("\n");
      const effectiveUrl = sourceUrl || extractUrlFromText(tableChunk);
      const content = injectContext(tableChunk, documentName, context, pages || undefined, effectiveUrl);

      chunks.push({
        content,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          documentName,
          chunkingType: "table",
          sectionContext: context,
          ...(pages ? { pages } : {}),
          ...(effectiveUrl ? { sourceUrl: effectiveUrl } : {}),
        },
      });
    }
  }

  return chunks;
}

interface TableBlock {
  type: "tabela" | "texto";
  content: string;
}

function separateTableBlocks(text: string): TableBlock[] {
  const lines = text.split("\n");
  const blocks: TableBlock[] = [];
  let currentBlock: string[] = [];
  let currentType: "tabela" | "texto" | null = null;

  for (const line of lines) {
    const isPipeLine = /^\s*\|.+\|\s*$/.test(line);
    const type: "tabela" | "texto" = isPipeLine ? "tabela" : "texto";

    if (currentType !== null && type !== currentType) {
      const content = currentBlock.join("\n").trim();
      if (content.length > 0) blocks.push({ type: currentType, content });
      currentBlock = [];
    }
    currentType = type;
    currentBlock.push(line);
  }

  if (currentBlock.length > 0 && currentType !== null) {
    const content = currentBlock.join("\n").trim();
    if (content.length > 0) blocks.push({ type: currentType, content });
  }
  return blocks;
}

async function generalChunking(
  text: string,
  filename: string,
  typeOverride?: "table" | "general",
  sourceUrl?: string,
  initialPage: string = ""
): Promise<ChunkData[]> {
  const documentName = generateDocumentName(filename);
  const chunks: ChunkData[] = [];
  const type = typeOverride || "general";

  // LangChain Splitter padrão para texto corrido
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE_GENERAL,
    chunkOverlap: CHUNK_OVERLAP_GENERAL,
    separators: ["\n\n", "\n", ". ", " "],
  });

  const parts = await splitter.splitText(text);
  let lastPage = initialPage;

  for (const part of parts) {
    const { cleanText: partTrimmed, pages, nextLastPage } = extractPageInfoFromChunk(part, lastPage);
    lastPage = nextLastPage;
    if (partTrimmed.length === 0) continue;

    const effectiveUrl = sourceUrl || extractUrlFromText(partTrimmed);
    const content = injectContext(partTrimmed, documentName, "", pages || undefined, effectiveUrl);

    chunks.push({
      content,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        documentName,
        chunkingType: type,
        sectionContext: "",
        ...(pages ? { pages } : {}),
        ...(effectiveUrl ? { sourceUrl: effectiveUrl } : {}),
      },
    });
  }

  return chunks;
}

async function splitIntoChunks(text: string, filename: string, sourceUrl?: string): Promise<ChunkData[]> {
  const chunkingType = detectChunkingType(text, filename);
  console.log(`🔀 [Roteamento] "${filename}" → estratégia: ${chunkingType.toUpperCase()}`);

  let chunks: ChunkData[];

  switch (chunkingType) {
    case "syllabus":
      chunks = await syllabusChunking(text, filename, sourceUrl);
      break;
    case "normative":
      chunks = await normativeChunking(text, filename, sourceUrl);
      break;
    case "table":
      chunks = await tableChunking(text, filename, sourceUrl);
      break;
    case "general":
    default:
      chunks = await generalChunking(text, filename, undefined, sourceUrl);
      break;
  }

  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  console.log(`✂️  [Chunking] "${filename}" → ${chunks.length} chunks (tipo: ${chunkingType}, maxChars: ${CHUNK_SIZE_GENERAL})`);
  return chunks;
}

// ===========================================================================
// ETAPA 3 — VETORIZAÇÃO E GRAVAÇÃO
// ===========================================================================

function truncateForEmbedding(text: string): string {
  if (text.length <= EMBEDDING_MAX_CHARS) return text;
  console.warn(`⚠️ [Embedding] Chunk com ${text.length} chars excede o limite. Truncando.`);
  const cut = text.lastIndexOf(". ", EMBEDDING_MAX_CHARS);
  return cut > EMBEDDING_MAX_CHARS * 0.5
    ? text.slice(0, cut + 1).trim()
    : text.slice(0, EMBEDDING_MAX_CHARS).trim();
}

async function vectorizeAndSave(chunks: ChunkData[]): Promise<number> {
  let saved = 0;
  let dimensionErrors = 0;
  let otherErrors = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchLabel = `[Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}]`;

    console.log(`🔢 [Embedding] ${batchLabel} Processando ${batch.length} chunks em paralelo...`);

    const results = await Promise.allSettled(
      batch.map(async (chunk, j) => {
        const idx = i + j;
        const progresso = `[${idx + 1}/${chunks.length}]`;
        const safeContent = truncateForEmbedding(chunk.content);

        const embedding = await generateOllamaEmbedding(safeContent);
        const vectorStr = `[${embedding.join(",")}]`;

        await pool.query(
          `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`,
          [safeContent, JSON.stringify(chunk.metadata), vectorStr]
        );

        console.log(`💾 [Banco] ${progresso} Chunk gravado (${embedding.length} dimensões)`);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        saved++;
      } else {
        const errMsg = result.reason?.message || String(result.reason);
        if (errMsg.includes("expected") && errMsg.includes("dimensions")) {
          dimensionErrors++;
          if (dimensionErrors === 1) {
            console.error(`❌ [Embedding] ERRO DE DIMENSÃO...`);
          }
        } else {
          otherErrors++;
          console.error(`❌ [Embedding] Erro no lote: ${errMsg}`);
        }
      }
    }

    if (dimensionErrors > 0 && saved === 0 && i + BATCH_SIZE >= chunks.length) break;
  }

  return saved;
}

// ===========================================================================
// PIPELINE PRINCIPAL
// ===========================================================================

export async function processDocument(
  buffer: Buffer,
  filename: string,
  mimetype: string = "application/pdf",
  sourceUrl?: string
): Promise<UploadResponse> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 [Ingestão] Processando "${filename}" (${mimetype})${sourceUrl ? ` | Link: ${sourceUrl}` : ""}`);
  console.log(`${"=".repeat(60)}\n`);

  const start = Date.now();
  const rawText = await extractText(buffer, filename, mimetype);

  if (rawText.trim().length === 0) {
    return { message: "O arquivo não contém texto extraível.", file: filename, totalChunks: 0, savedChunks: 0 };
  }

  const text = sanitizeText(rawText);

  const chunks = await splitIntoChunks(text, filename, sourceUrl);

  const savedChunks = await vectorizeAndSave(chunks);
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  const failures = chunks.length - savedChunks;

  if (savedChunks === 0 && chunks.length > 0) {
    console.error(`❌ [Ingestão] "${filename}" FALHOU em ${duration}s — 0/${chunks.length} chunks gravados`);
    return {
      message: `Falha na ingestão: nenhum chunk foi gravado (0/${chunks.length}). Possível causa de dimensão.`,
      file: filename, totalChunks: chunks.length, savedChunks: 0,
    };
  }

  if (failures > 0) {
    console.warn(`⚠️  [Ingestão] "${filename}" concluído com erros em ${duration}s — ${savedChunks}/${chunks.length} chunks (${failures} falhas)`);
  } else {
    console.log(`✅ [Ingestão] "${filename}" concluído em ${duration}s — ${savedChunks}/${chunks.length} chunks`);
  }

  return {
    message: failures > 0 ? `Documento processado parcialmente em ${duration}s. ${failures} chunk(s) falharam.` : `Documento processado com sucesso em ${duration}s.`,
    file: filename, totalChunks: chunks.length, savedChunks,
  };
}

// ===========================================================================
// LISTAGEM E REMOÇÃO DE DOCUMENTOS
// ===========================================================================

export async function listProcessedDocuments(): Promise<{ filename: string; totalChunks: number; ultimaAtualizacao: string; sourceUrl?: string }[]> {
  try {
    const result = await pool.query(`
      SELECT
        metadata->>'filename' AS filename,
        COUNT(*) AS total_chunks,
        MAX(created_at) AS ultima_atualizacao,
        MAX(metadata->>'sourceUrl') AS source_url
      FROM documents
      GROUP BY metadata->>'filename'
      ORDER BY MAX(created_at) DESC
    `);
    return result.rows.map((row) => ({
      filename: row.filename,
      totalChunks: Number(row.total_chunks),
      ultimaAtualizacao: row.ultima_atualizacao,
      ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    }));
  } catch (error) {
    console.error("[Embedding] Erro ao listar documentos:", error);
    return [];
  }
}

export async function removeDocument(filename: string): Promise<number> {
  console.log(`🗑️  [Remoção] Removendo "${filename}" do banco...`);
  const result = await pool.query(`DELETE FROM documents WHERE metadata->>'filename' = $1`, [filename]);
  const removed = result.rowCount ?? 0;
  console.log(`🗑️  [Remoção] ${removed} chunks removidos`);
  return removed;
}