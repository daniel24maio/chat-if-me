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
const CHUNK_SIZE_GENERAL = 2048;
const CHUNK_OVERLAP_GENERAL = 256;
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

    // Extrai o texto preservando a estrutura semântica/markdown gerada pela IA espacial
    const finalText = result.text || JSON.stringify(result);

    console.log(`📄 [Extração] Concluído via LiteParse: ${finalText.length} caracteres extraídos de "${filename}"`);
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

function injectContext(text: string, documentName: string, sectionContext: string): string {
  const parts = [`Documento: ${documentName}`];
  if (sectionContext) {
    parts.push(`Contexto: ${sectionContext}`);
  }
  return `[${parts.join(" | ")}]\n\n${text}`;
}

type ChunkingType = "juridical" | "table" | "general";

function detectChunkingType(text: string, filename: string): ChunkingType {
  const tableSeparators = (text.match(/\|[\s-]+\|/g) || []).length;
  const pipeLines = (text.match(/^\|.+\|$/gm) || []).length;
  if (tableSeparators >= 1 && pipeLines >= 5) return "table";

  const articles = (text.match(/\bArt\.\s+\d+/g) || []).length;
  const chapters = (text.match(/\bCAP[IÍ]TULO\s+[IVXLCDM\d]+/gi) || []).length;
  if (articles >= 3 || chapters >= 2) return "juridical";

  if (/regulament|norma|resolu[çc]|portaria|edital|delibera|estatut|regimento/i.test(filename)) {
    return "juridical";
  }

  return "general";
}

async function juridicalChunking(text: string, filename: string): Promise<ChunkData[]> {
  const documentName = generateDocumentName(filename);
  const chunks: ChunkData[] = [];

  // LangChain Splitter configurado com hierarquia jurídica
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: EMBEDDING_MAX_CHARS - 300, // Margem para o prefixo de contexto
    chunkOverlap: 200,
    separators: ["\nCAPÍTULO ", "\nTÍTULO ", "\nSeção ", "\nArt. ", "\n\n", "\n", ". ", " "],
    keepSeparator: true
  });

  const parts = await splitter.splitText(text);
  let currentContext = "";

  for (const part of parts) {
    const partTrimmed = part.trim();
    if (partTrimmed.length === 0) continue;

    // Atualiza o contexto se a parte contiver um marcador de hierarquia
    const hierarchyMatch = partTrimmed.match(/^(?:CAP[IÍ]TULO|T[IÍ]TULO|Se[cç][aã]o)\s+[IVXLCDM\d]+.*?(?:\n|$)/i);
    if (hierarchyMatch) {
      currentContext = hierarchyMatch[0].trim();
    }

    const contentWithContext = injectContext(partTrimmed, documentName, currentContext);

    chunks.push({
      content: contentWithContext,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        documentName,
        chunkingType: "juridical",
        sectionContext: currentContext,
      },
    });
  }

  return chunks;
}

async function tableChunking(text: string, filename: string): Promise<ChunkData[]> {
  const documentName = generateDocumentName(filename);
  const chunks: ChunkData[] = [];
  const blocks = separateTableBlocks(text);

  for (const block of blocks) {
    if (block.type === "texto") {
      const subChunks = await generalChunking(block.content, filename, "table");
      chunks.push(...subChunks);
      continue;
    }

    const lines = block.content.split("\n").filter((l) => l.trim().length > 0);
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
      const content = injectContext(block.content.trim(), documentName, "Tabela/Matriz");
      chunks.push({
        content,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          documentName,
          chunkingType: "table",
          sectionContext: "Tabela/Matriz",
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
      const content = injectContext(tableChunk, documentName, context);

      chunks.push({
        content,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          documentName,
          chunkingType: "table",
          sectionContext: context,
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
  typeOverride?: "table" | "general"
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

  for (const part of parts) {
    if (part.trim().length === 0) continue;
    const content = injectContext(part.trim(), documentName, "");

    chunks.push({
      content,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        documentName,
        chunkingType: type,
        sectionContext: "",
      },
    });
  }

  return chunks;
}

async function splitIntoChunks(text: string, filename: string): Promise<ChunkData[]> {
  const chunkingType = detectChunkingType(text, filename);
  console.log(`🔀 [Roteamento] "${filename}" → estratégia: ${chunkingType.toUpperCase()}`);

  let chunks: ChunkData[];

  switch (chunkingType) {
    case "juridical":
      chunks = await juridicalChunking(text, filename);
      break;
    case "table":
      chunks = await tableChunking(text, filename);
      break;
    case "general":
    default:
      chunks = await generalChunking(text, filename);
      break;
  }

  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  console.log(`✂️  [Chunking] "${filename}" → ${chunks.length} chunks (tipo: ${chunkingType})`);
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
  mimetype: string = "application/pdf"
): Promise<UploadResponse> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 [Ingestão] Processando "${filename}" (${mimetype})`);
  console.log(`${"=".repeat(60)}\n`);

  const start = Date.now();
  const rawText = await extractText(buffer, filename, mimetype);

  if (rawText.trim().length === 0) {
    return { message: "O arquivo não contém texto extraível.", file: filename, totalChunks: 0, savedChunks: 0 };
  }

  const text = sanitizeText(rawText);

  const chunks = await splitIntoChunks(text, filename);

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

export async function listProcessedDocuments(): Promise<{ filename: string; totalChunks: number; ultimaAtualizacao: string }[]> {
  try {
    const result = await pool.query(`
      SELECT metadata->>'filename' AS filename, COUNT(*) AS total_chunks, MAX(created_at) AS ultima_atualizacao
      FROM documents GROUP BY metadata->>'filename' ORDER BY MAX(created_at) DESC
    `);
    return result.rows.map((row) => ({ filename: row.filename, totalChunks: Number(row.total_chunks), ultimaAtualizacao: row.ultima_atualizacao }));
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