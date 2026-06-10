import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import xlsx from "xlsx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { LiteParse } from "@llamaindex/liteparse";
import * as fs from "fs";
import * as path from "path";
import { pool } from "../config/database.js";
import { gerarEmbeddingOllama } from "../config/ollama.js";
import { sanitizarTexto } from "./sanitization.service.js";
import type {
  ChunkData,
  UploadResponse,
} from "../interfaces/embedding.interfaces.js";

/**
 * Serviço de Ingestão de Documentos (Embedding) — v6 (LangChain + LiteParse).
 */

const EMBEDDING_MAX_CHARS = 4000;
const CHUNK_SIZE_GERAL = 2048;
const CHUNK_OVERLAP_GERAL = 256;
const TABELA_MAX_LINHAS_POR_CHUNK = 30;

const BATCH_SIZE = 32;

// ===========================================================================
// ETAPA 1 — EXTRAÇÃO DE TEXTO (Multi-formato com LiteParse)
// ===========================================================================

async function extrairTextoPDF(buffer: Buffer, filename: string): Promise<string> {
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
    const textoFinal = result.text || JSON.stringify(result);

    console.log(`📄 [Extração] Concluído via LiteParse: ${textoFinal.length} caracteres extraídos de "${filename}"`);
    return textoFinal;
  } catch (error) {
    console.error(`❌ [Extração] Erro no LiteParse ao processar "${filename}":`, error);
    throw error;
  } finally {
    // Garante a limpeza do arquivo temporário, mesmo em caso de erro
    await fs.promises.unlink(tempPath).catch(() => console.warn(`⚠️ Não foi possível apagar o arquivo temporário: ${tempPath}`));
  }
}

async function extrairTextoImagem(buffer: Buffer, filename: string): Promise<string> {
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

async function extrairTextoWord(buffer: Buffer, filename: string): Promise<string> {
  console.log(`📝 [Extração] Iniciando extração de documento Word "${filename}"...`);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

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

async function extrairTexto(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
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
// ETAPA 2 — ROTEAMENTO E CHUNKING SEMÂNTICO ADAPTATIVO (LangChain)
// ===========================================================================

function gerarNomeDocumento(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function injetarContexto(texto: string, nomeDocumento: string, contextoSecao: string): string {
  const partes = [`Documento: ${nomeDocumento}`];
  if (contextoSecao) {
    partes.push(`Contexto: ${contextoSecao}`);
  }
  return `[${partes.join(" | ")}]\n\n${texto}`;
}

type TipoChunking = "juridico" | "tabela" | "geral";

function detectarTipoChunking(texto: string, filename: string): TipoChunking {
  const separadoresTabela = (texto.match(/\|[\s-]+\|/g) || []).length;
  const linhasComPipe = (texto.match(/^\|.+\|$/gm) || []).length;
  if (separadoresTabela >= 1 && linhasComPipe >= 5) return "tabela";

  const artigos = (texto.match(/\bArt\.\s+\d+/g) || []).length;
  const capitulos = (texto.match(/\bCAP[IÍ]TULO\s+[IVXLCDM\d]+/gi) || []).length;
  if (artigos >= 3 || capitulos >= 2) return "juridico";

  if (/regulament|norma|resolu[çc]|portaria|edital|delibera|estatut|regimento/i.test(filename)) {
    return "juridico";
  }

  return "geral";
}

async function chunkingJuridico(texto: string, filename: string): Promise<ChunkData[]> {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks: ChunkData[] = [];

  // LangChain Splitter configurado com hierarquia jurídica
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: EMBEDDING_MAX_CHARS - 300, // Margem para o prefixo de contexto
    chunkOverlap: 200,
    separators: ["\nCAPÍTULO ", "\nTÍTULO ", "\nSeção ", "\nArt. ", "\n\n", "\n", ". ", " "],
    keepSeparator: true
  });

  const partes = await splitter.splitText(texto);
  let contextoAtual = "";

  for (const parte of partes) {
    const parteTrimmed = parte.trim();
    if (parteTrimmed.length === 0) continue;

    // Atualiza o contexto se a parte contiver um marcador de hierarquia
    const matchHierarquia = parteTrimmed.match(/^(?:CAP[IÍ]TULO|T[IÍ]TULO|Se[cç][aã]o)\s+[IVXLCDM\d]+.*?(?:\n|$)/i);
    if (matchHierarquia) {
      contextoAtual = matchHierarquia[0].trim();
    }

    const conteudoComContexto = injetarContexto(parteTrimmed, nomeDocumento, contextoAtual);

    chunks.push({
      conteudo: conteudoComContexto,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        nomeDocumento,
        tipoChunking: "juridico",
        contextoSecao: contextoAtual,
      },
    });
  }

  return chunks;
}

async function chunkingTabela(texto: string, filename: string): Promise<ChunkData[]> {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks: ChunkData[] = [];
  const blocos = separarBlocosTabela(texto);

  for (const bloco of blocos) {
    if (bloco.tipo === "texto") {
      const subChunks = await chunkingGeral(bloco.conteudo, filename, "tabela");
      chunks.push(...subChunks);
      continue;
    }

    const linhas = bloco.conteudo.split("\n").filter((l) => l.trim().length > 0);
    if (linhas.length === 0) continue;

    let cabecalho = "";
    let linhasDados: string[] = [];

    if (linhas.length >= 2 && /^\|[\s\-:|]+\|/.test(linhas[1])) {
      cabecalho = linhas[0] + "\n" + linhas[1];
      linhasDados = linhas.slice(2);
    } else {
      linhasDados = linhas;
    }

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

    for (let i = 0; i < linhasDados.length; i += TABELA_MAX_LINHAS_POR_CHUNK) {
      const fatia = linhasDados.slice(i, i + TABELA_MAX_LINHAS_POR_CHUNK);
      const parteNum = Math.floor(i / TABELA_MAX_LINHAS_POR_CHUNK) + 1;
      const totalPartes = Math.ceil(linhasDados.length / TABELA_MAX_LINHAS_POR_CHUNK);
      const contexto = `Tabela/Matriz (parte ${parteNum}/${totalPartes})`;

      const tabelaChunk = cabecalho ? `${cabecalho}\n${fatia.join("\n")}` : fatia.join("\n");
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

interface BlocoTabela {
  tipo: "tabela" | "texto";
  conteudo: string;
}

function separarBlocosTabela(texto: string): BlocoTabela[] {
  const linhas = texto.split("\n");
  const blocos: BlocoTabela[] = [];
  let blocoAtual: string[] = [];
  let tipoAtual: "tabela" | "texto" | null = null;

  for (const linha of linhas) {
    const ehLinhaPipe = /^\s*\|.+\|\s*$/.test(linha);
    const tipo: "tabela" | "texto" = ehLinhaPipe ? "tabela" : "texto";

    if (tipoAtual !== null && tipo !== tipoAtual) {
      const conteudo = blocoAtual.join("\n").trim();
      if (conteudo.length > 0) blocos.push({ tipo: tipoAtual, conteudo });
      blocoAtual = [];
    }
    tipoAtual = tipo;
    blocoAtual.push(linha);
  }

  if (blocoAtual.length > 0 && tipoAtual !== null) {
    const conteudo = blocoAtual.join("\n").trim();
    if (conteudo.length > 0) blocos.push({ tipo: tipoAtual, conteudo });
  }
  return blocos;
}

async function chunkingGeral(
  texto: string,
  filename: string,
  tipoOverride?: "tabela" | "geral"
): Promise<ChunkData[]> {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks: ChunkData[] = [];
  const tipo = tipoOverride || "geral";

  // LangChain Splitter padrão para texto corrido
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE_GERAL,
    chunkOverlap: CHUNK_OVERLAP_GERAL,
    separators: ["\n\n", "\n", ". ", " "],
  });

  const partes = await splitter.splitText(texto);

  for (const parte of partes) {
    if (parte.trim().length === 0) continue;
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

  return chunks;
}

async function dividirEmChunks(texto: string, filename: string): Promise<ChunkData[]> {
  const tipoChunking = detectarTipoChunking(texto, filename);
  console.log(`🔀 [Roteamento] "${filename}" → estratégia: ${tipoChunking.toUpperCase()}`);

  let chunks: ChunkData[];

  switch (tipoChunking) {
    case "juridico":
      chunks = await chunkingJuridico(texto, filename);
      break;
    case "tabela":
      chunks = await chunkingTabela(texto, filename);
      break;
    case "geral":
    default:
      chunks = await chunkingGeral(texto, filename);
      break;
  }

  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  console.log(`✂️  [Chunking] "${filename}" → ${chunks.length} chunks (tipo: ${tipoChunking})`);
  return chunks;
}

// ===========================================================================
// ETAPA 3 — VETORIZAÇÃO E GRAVAÇÃO
// ===========================================================================

function truncarParaEmbedding(texto: string): string {
  if (texto.length <= EMBEDDING_MAX_CHARS) return texto;
  console.warn(`⚠️ [Embedding] Chunk com ${texto.length} chars excede o limite. Truncando.`);
  const corte = texto.lastIndexOf(". ", EMBEDDING_MAX_CHARS);
  return corte > EMBEDDING_MAX_CHARS * 0.5
    ? texto.slice(0, corte + 1).trim()
    : texto.slice(0, EMBEDDING_MAX_CHARS).trim();
}

async function vetorizarEGravar(chunks: ChunkData[]): Promise<number> {
  let gravados = 0;
  let errosDimensao = 0;
  let outrosErros = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchLabel = `[Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}]`;

    console.log(`🔢 [Embedding] ${batchLabel} Processando ${batch.length} chunks em paralelo...`);

    const results = await Promise.allSettled(
      batch.map(async (chunk, j) => {
        const idx = i + j;
        const progresso = `[${idx + 1}/${chunks.length}]`;
        const conteudoSeguro = truncarParaEmbedding(chunk.conteudo);

        const embedding = await gerarEmbeddingOllama(conteudoSeguro);
        const vectorStr = `[${embedding.join(",")}]`;

        await pool.query(
          `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`,
          [conteudoSeguro, JSON.stringify(chunk.metadata), vectorStr]
        );

        console.log(`💾 [Banco] ${progresso} Chunk gravado (${embedding.length} dimensões)`);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        gravados++;
      } else {
        const errMsg = result.reason?.message || String(result.reason);
        if (errMsg.includes("expected") && errMsg.includes("dimensions")) {
          errosDimensao++;
          if (errosDimensao === 1) {
            console.error(`❌ [Embedding] ERRO DE DIMENSÃO...`);
          }
        } else {
          outrosErros++;
          console.error(`❌ [Embedding] Erro no lote: ${errMsg}`);
        }
      }
    }

    if (errosDimensao > 0 && gravados === 0 && i + BATCH_SIZE >= chunks.length) break;
  }

  return gravados;
}

// ===========================================================================
// PIPELINE PRINCIPAL
// ===========================================================================

export async function processarDocumento(
  buffer: Buffer,
  filename: string,
  mimetype: string = "application/pdf"
): Promise<UploadResponse> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 [Ingestão] Processando "${filename}" (${mimetype})`);
  console.log(`${"=".repeat(60)}\n`);

  const inicio = Date.now();
  const textoRaw = await extrairTexto(buffer, filename, mimetype);

  if (textoRaw.trim().length === 0) {
    return { mensagem: "O arquivo não contém texto extraível.", arquivo: filename, totalChunks: 0, chunksGravados: 0 };
  }

  const texto = sanitizarTexto(textoRaw);

  const chunks = await dividirEmChunks(texto, filename);

  const chunksGravados = await vetorizarEGravar(chunks);
  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  const falhas = chunks.length - chunksGravados;

  if (chunksGravados === 0 && chunks.length > 0) {
    console.error(`❌ [Ingestão] "${filename}" FALHOU em ${duracao}s — 0/${chunks.length} chunks gravados`);
    return {
      mensagem: `Falha na ingestão: nenhum chunk foi gravado (0/${chunks.length}). Possível causa de dimensão.`,
      arquivo: filename, totalChunks: chunks.length, chunksGravados: 0,
    };
  }

  if (falhas > 0) {
    console.warn(`⚠️  [Ingestão] "${filename}" concluído com erros em ${duracao}s — ${chunksGravados}/${chunks.length} chunks (${falhas} falhas)`);
  } else {
    console.log(`✅ [Ingestão] "${filename}" concluído em ${duracao}s — ${chunksGravados}/${chunks.length} chunks`);
  }

  return {
    mensagem: falhas > 0 ? `Documento processado parcialmente em ${duracao}s. ${falhas} chunk(s) falharam.` : `Documento processado com sucesso em ${duracao}s.`,
    arquivo: filename, totalChunks: chunks.length, chunksGravados,
  };
}

// ===========================================================================
// LISTAGEM E REMOÇÃO DE DOCUMENTOS
// ===========================================================================

export async function listarDocumentosProcessados(): Promise<{ filename: string; totalChunks: number; ultimaAtualizacao: string }[]> {
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

export async function removerDocumento(filename: string): Promise<number> {
  console.log(`🗑️  [Remoção] Removendo "${filename}" do banco...`);
  const result = await pool.query(`DELETE FROM documents WHERE metadata->>'filename' = $1`, [filename]);
  const removidos = result.rowCount ?? 0;
  console.log(`🗑️  [Remoção] ${removidos} chunks removidos`);
  return removidos;
}