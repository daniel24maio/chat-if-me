// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// src/routes/chat.routes.ts
import { Router } from "express";

// src/config/database.ts
import pg from "pg";
var { Pool } = pg;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
async function testarConexaoDB() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as agora");
    console.log(
      `\u2705 [Database] Conectado ao PostgreSQL \u2014 ${result.rows[0].agora}`
    );
    client.release();
  } catch (error) {
    console.error("\u274C [Database] Falha ao conectar ao PostgreSQL:", error);
    console.error(
      "   Verifique a vari\xE1vel DATABASE_URL no arquivo .env"
    );
  }
}

// src/config/ollama.ts
var OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
var EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
var LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:latest";
var REWRITE_MODEL = process.env.OLLAMA_REWRITE_MODEL || "qwen3.5:latest";
async function verificarOllama() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok)
      throw new Error(`Status ${response.status}`);
    const data = await response.json();
    const modelos = data.models?.map((m) => m.name) || [];
    console.log(`\u2705 [Ollama] Conectado em ${OLLAMA_BASE_URL}`);
    console.log(`   Modelos dispon\xEDveis: ${modelos.join(", ") || "nenhum"}`);
  } catch (error) {
    console.error(`\u274C [Ollama] Servidor inacess\xEDvel em ${OLLAMA_BASE_URL}`);
    console.error(
      "   Verifique se o Ollama est\xE1 rodando e a vari\xE1vel OLLAMA_BASE_URL"
    );
  }
}
async function gerarEmbeddingOllama(texto) {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: texto
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[Ollama Embedding] Erro ${response.status}: ${errorText}`
    );
  }
  const data = await response.json();
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error(
      "[Ollama Embedding] Resposta inv\xE1lida \u2014 campo 'embedding' ausente"
    );
  }
  return data.embedding;
}
async function reescreverComLLM(systemPrompt, pergunta) {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: REWRITE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pergunta }
      ],
      stream: false,
      options: {
        temperature: 0
        // Determinístico — sem criatividade na reescrita
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[Ollama Rewrite] Erro ${response.status}: ${errorText}`
    );
  }
  const data = await response.json();
  if (!data.message?.content) {
    throw new Error(
      "[Ollama Rewrite] Resposta inv\xE1lida \u2014 campo 'message.content' ausente"
    );
  }
  return data.message.content.trim();
}
async function streamRespostaOllama(mensagens, res, fontes) {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  res.write(`data: ${JSON.stringify({ type: "fontes", fontes })}

`);
  const ollamaResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: mensagens,
      stream: true
    })
  });
  if (!ollamaResponse.ok) {
    const errorText = await ollamaResponse.text();
    throw new Error(
      `[Ollama LLM Stream] Erro ${ollamaResponse.status}: ${errorText}`
    );
  }
  if (!ollamaResponse.body) {
    throw new Error("[Ollama LLM Stream] Corpo da resposta vazio");
  }
  const reader = ollamaResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
          continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (chunk.message?.content) {
            res.write(
              `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`
            );
          }
          if (chunk.done) {
            console.log("\u{1F916} [Stream] Gera\xE7\xE3o conclu\xEDda pelo Ollama");
          }
        } catch {
        }
      }
    }
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim());
        if (chunk.message?.content) {
          res.write(
            `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`
          );
        }
      } catch {
      }
    }
  } finally {
    reader.releaseLock();
  }
  res.write(`data: [DONE]

`);
}

// src/services/rag.service.ts
var REWRITE_SYSTEM_PROMPT = `Voc\xEA \xE9 um assistente de pr\xE9-processamento de consultas para um sistema de busca de documentos acad\xEAmicos do IFMG (Instituto Federal de Minas Gerais), Campus Ouro Branco, curso de Sistemas de Informa\xE7\xE3o.

Sua tarefa: reescrever a pergunta do usu\xE1rio para melhorar a busca sem\xE2ntica em documentos acad\xEAmicos.

REGRAS:
1. Expanda TODAS as siglas acad\xEAmicas:
   - TCC \u2192 Trabalho de Conclus\xE3o de Curso
   - PPC \u2192 Projeto Pedag\xF3gico do Curso
   - CR \u2192 Coeficiente de Rendimento
   - ENADE \u2192 Exame Nacional de Desempenho de Estudantes
   - TI \u2192 Tecnologia da Informa\xE7\xE3o
   - SI \u2192 Sistemas de Informa\xE7\xE3o
   - IFMG \u2192 Instituto Federal de Minas Gerais
   - NDE \u2192 N\xFAcleo Docente Estruturante
   - CEAD \u2192 Centro de Educa\xE7\xE3o Aberta e a Dist\xE2ncia
   - IRA \u2192 \xCDndice de Rendimento Acad\xEAmico
   - AC \u2192 Atividades Complementares
   - DP \u2192 Depend\xEAncia (disciplina em depend\xEAncia)
2. Transforme linguagem coloquial em linguagem formal/acad\xEAmica.
3. Adicione contexto impl\xEDcito quando cab\xEDvel (ex: "reprovar" \u2192 "crit\xE9rios de reprova\xE7\xE3o").
4. Mantenha o sentido original da pergunta.
5. Responda APENAS com a pergunta reescrita, sem explica\xE7\xF5es, sem aspas, sem prefixos.`;
async function reescreverPergunta(pergunta) {
  try {
    console.log(`\u270D\uFE0F  [Reescrita] Original: "${pergunta}"`);
    const reescrita = await reescreverComLLM(REWRITE_SYSTEM_PROMPT, pergunta);
    if (!reescrita || reescrita.length > 1e3) {
      console.log(`\u270D\uFE0F  [Reescrita] Resultado inv\xE1lido, usando original.`);
      return pergunta;
    }
    console.log(`\u270D\uFE0F  [Reescrita] Resultado: "${reescrita}"`);
    return reescrita;
  } catch (error) {
    console.warn(
      `\u26A0\uFE0F  [Reescrita] Falha na reescrita, usando pergunta original:`,
      error instanceof Error ? error.message : error
    );
    return pergunta;
  }
}
async function gerarEmbedding(texto) {
  console.log(`\u{1F522} [RAG] Vetorizando pergunta: "${texto.substring(0, 60)}..."`);
  const embedding = await gerarEmbeddingOllama(texto);
  console.log(
    `\u{1F522} [RAG] Embedding gerado com sucesso (${embedding.length} dimens\xF5es)`
  );
  return embedding;
}
var RRF_K = 60;
var RRF_ALPHA = 0.5;
async function buscarHibrido(embedding, queryTexto, limite = 5) {
  console.log(
    `\u{1F50D} [RAG] Busca h\xEDbrida: vetorial (\u03B1=${RRF_ALPHA}) + FTS (1-\u03B1=${1 - RRF_ALPHA}), k=${RRF_K}`
  );
  const vectorStr = `[${embedding.join(",")}]`;
  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           1 - (embedding <=> $1::vector) AS similaridade,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 20
       ),
       lexical AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) AS ts_score,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) DESC
           ) AS rank
         FROM documents
         WHERE content_tsv @@ plainto_tsquery('portuguese_unaccent', $2)
         ORDER BY ts_score DESC
         LIMIT 20
       )
     SELECT
       COALESCE(s.id, l.id) AS id,
       COALESCE(s.conteudo, l.conteudo) AS conteudo,
       COALESCE(s.origem, l.origem) AS origem,
       COALESCE(s.similaridade, 0) AS similaridade,
       (
         ${RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + s.rank), 0.0) +
         ${1 - RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + l.rank), 0.0)
       ) AS rrf_score
     FROM semantic s
     FULL OUTER JOIN lexical l ON s.id = l.id
     ORDER BY rrf_score DESC
     LIMIT $3`,
    [vectorStr, queryTexto, limite]
  );
  const documentos = result.rows.map((row) => ({
    conteudo: row.conteudo,
    origem: row.origem || "documento desconhecido",
    similaridade: Number(row.rrf_score)
  }));
  if (documentos.length === 0) {
    console.log(`\u{1F50D} [RAG] Nenhum documento encontrado (vetorial + FTS).`);
  } else {
    console.log(`\u{1F50D} [RAG] ${documentos.length} documentos (RRF h\xEDbrido):`);
    documentos.forEach((doc, i) => {
      console.log(
        `   ${i + 1}. [RRF: ${doc.similaridade.toFixed(4)}] ${doc.origem}: "${doc.conteudo.substring(0, 50)}..."`
      );
    });
  }
  return documentos;
}
function montarMensagensRAG(pergunta, documentos) {
  const contexto = documentos.length > 0 ? documentos.map(
    (doc, i) => `--- Trecho ${i + 1} (fonte: ${doc.origem}, similaridade: ${doc.similaridade.toFixed(2)}) ---
${doc.conteudo}`
  ).join("\n\n") : "Nenhum documento relevante foi encontrado na base de conhecimento.";
  const systemPrompt = `Voc\xEA \xE9 o chatIFme, assistente virtual oficial do curso de Sistemas de Informa\xE7\xE3o do IFMG Campus Ouro Branco.

Sua fun\xE7\xE3o \xE9 responder d\xFAvidas dos alunos sobre regulamentos, PPC (Projeto Pedag\xF3gico do Curso), grade curricular, normas acad\xEAmicas e informa\xE7\xF5es do campus.

REGRAS OBRIGAT\xD3RIAS (siga rigorosamente):
1. Use EXCLUSIVAMENTE as informa\xE7\xF5es dos trechos de documentos fornecidos abaixo.
2. N\xC3O invente, suponha ou complemente com conhecimento externo.
3. Se a resposta n\xE3o estiver nos trechos, diga: "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do curso ou acessar o portal do IFMG."
4. Seja educado, objetivo e claro.
5. Cite a fonte (nome do documento) quando poss\xEDvel.
6. Responda sempre em portugu\xEAs brasileiro.
7. Formate a resposta de forma organizada (use listas quando apropriado).

CONTEXTO (trechos dos documentos oficiais do curso):
${contexto}`;
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: pergunta }
  ];
}
async function processarPerguntaStream(pergunta, res) {
  console.log(`
${"\u2500".repeat(50)}`);
  console.log(`\u{1F4E8} [RAG] Nova pergunta (stream): "${pergunta}"`);
  console.log(`${"\u2500".repeat(50)}`);
  const inicio = Date.now();
  const perguntaReescrita = await reescreverPergunta(pergunta);
  const embedding = await gerarEmbedding(perguntaReescrita);
  const documentos = await buscarHibrido(embedding, perguntaReescrita);
  const fontes = documentos.map(
    (doc) => `${doc.origem} (similaridade: ${doc.similaridade.toFixed(2)})`
  );
  const mensagens = montarMensagensRAG(pergunta, documentos);
  console.log(
    `\u{1F916} [RAG] Iniciando streaming com ${documentos.length} documentos de contexto...`
  );
  await streamRespostaOllama(mensagens, res, fontes);
  const duracao = ((Date.now() - inicio) / 1e3).toFixed(1);
  console.log(`\u23F1\uFE0F  [RAG] Pipeline streaming conclu\xEDdo em ${duracao}s
`);
}

// src/controllers/chat.controller.ts
async function enviarPergunta(req, res) {
  try {
    const { pergunta } = req.body;
    if (!pergunta || typeof pergunta !== "string") {
      res.status(400).json({
        erro: "O campo 'pergunta' \xE9 obrigat\xF3rio e deve ser uma string."
      });
      return;
    }
    const perguntaTrimmed = pergunta.trim();
    if (perguntaTrimmed.length < 3) {
      res.status(400).json({
        erro: "A pergunta deve ter pelo menos 3 caracteres."
      });
      return;
    }
    if (perguntaTrimmed.length > 1e3) {
      res.status(400).json({
        erro: "A pergunta deve ter no m\xE1ximo 1000 caracteres."
      });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
      // Desabilita buffering em proxies nginx
    });
    req.on("close", () => {
      console.log("\u{1F50C} [SSE] Cliente desconectou durante o stream");
    });
    await processarPerguntaStream(perguntaTrimmed, res);
    res.end();
  } catch (error) {
    console.error("[ChatController] Erro ao processar pergunta:", error);
    if (res.headersSent) {
      const mensagemErro = error instanceof Error && error.message.includes("Ollama") ? "O servidor de IA ficou inacess\xEDvel durante a gera\xE7\xE3o. Tente novamente." : "Ocorreu um erro durante a gera\xE7\xE3o da resposta.";
      res.write(
        `data: ${JSON.stringify({ type: "erro", mensagem: mensagemErro })}

`
      );
      res.end();
    } else {
      res.status(500).json({
        erro: "Ocorreu um erro interno ao processar sua pergunta. Tente novamente mais tarde."
      });
    }
  }
}

// src/routes/chat.routes.ts
var chatRouter = Router();
chatRouter.post("/", enviarPergunta);

// src/routes/embedding.routes.ts
import { Router as Router2 } from "express";
import multer from "multer";

// src/services/embedding.service.ts
import { PDFExtract } from "pdf.js-extract";
import { createWorker } from "tesseract.js";
var CHUNK_SIZE = 1500;
var CHUNK_OVERLAP = 200;
var pdfExtract = new PDFExtract();
async function extrairTextoPDF(buffer, filename) {
  console.log(
    `\u{1F4C4} [Extra\xE7\xE3o] Iniciando extra\xE7\xE3o avan\xE7ada de "${filename}"...`
  );
  const data = await pdfExtract.extractBuffer(buffer);
  const paginas = [];
  for (let pIdx = 0; pIdx < data.pages.length; pIdx++) {
    const page = data.pages[pIdx];
    const items = page.content;
    if (items.length === 0)
      continue;
    const linhas = agruparPorLinhas(items);
    const ehTabela = detectarTabela(linhas);
    let textoPage;
    if (ehTabela) {
      textoPage = formatarComoTabela(linhas);
      console.log(`   \u{1F4CA} P\xE1gina ${pIdx + 1}: tabela detectada`);
    } else {
      textoPage = linhas.map((linha) => linha.join(" ")).join("\n");
    }
    paginas.push(`--- P\xE1gina ${pIdx + 1} ---
${textoPage}`);
  }
  const textoFinal = paginas.join("\n\n");
  console.log(
    `\u{1F4C4} [Extra\xE7\xE3o] Conclu\xEDdo: ${data.pages.length} p\xE1ginas, ${textoFinal.length} caracteres`
  );
  return textoFinal;
}
function agruparPorLinhas(items) {
  if (items.length === 0)
    return [];
  const sorted = [...items].filter((it) => it.str.trim().length > 0).sort((a, b) => a.y - b.y || a.x - b.x);
  const linhas = [];
  let linhaAtual = [];
  let yAtual = sorted[0]?.y ?? 0;
  for (const item of sorted) {
    if (Math.abs(item.y - yAtual) > 3) {
      if (linhaAtual.length > 0)
        linhas.push(linhaAtual);
      linhaAtual = [];
      yAtual = item.y;
    }
    linhaAtual.push(item.str.trim());
  }
  if (linhaAtual.length > 0)
    linhas.push(linhaAtual);
  return linhas;
}
function detectarTabela(linhas) {
  if (linhas.length < 3)
    return false;
  const colCounts = linhas.filter((l) => l.length >= 2).map((l) => l.length);
  if (colCounts.length < 3)
    return false;
  const moda = colCounts.sort(
    (a, b) => colCounts.filter((v) => v === b).length - colCounts.filter((v) => v === a).length
  )[0];
  const consistentes = colCounts.filter((c) => c === moda).length;
  return consistentes / colCounts.length >= 0.6;
}
function formatarComoTabela(linhas) {
  if (linhas.length === 0)
    return "";
  const maxCols = Math.max(...linhas.map((l) => l.length));
  const resultado = [];
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    while (linha.length < maxCols)
      linha.push("");
    resultado.push(`| ${linha.join(" | ")} |`);
    if (i === 0) {
      resultado.push(`| ${linha.map(() => "---").join(" | ")} |`);
    }
  }
  return resultado.join("\n");
}
async function extrairTextoImagem(buffer, filename) {
  console.log(`\u{1F50D} [OCR] Iniciando OCR de "${filename}"...`);
  const worker = await createWorker("por");
  try {
    const {
      data: { text }
    } = await worker.recognize(buffer);
    console.log(
      `\u{1F50D} [OCR] Conclu\xEDdo: ${text.length} caracteres extra\xEDdos de "${filename}"`
    );
    return text;
  } finally {
    await worker.terminate();
  }
}
async function extrairTexto(buffer, filename, mimetype) {
  if (mimetype === "application/pdf") {
    return extrairTextoPDF(buffer, filename);
  }
  if (mimetype.startsWith("image/")) {
    return extrairTextoImagem(buffer, filename);
  }
  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }
  throw new Error(`Formato n\xE3o suportado: ${mimetype}`);
}
function dividirEmChunks(texto, filename) {
  const blocos = texto.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  if (blocos.length === 0) {
    console.warn(`\u26A0\uFE0F [Chunking] Texto vazio em "${filename}"`);
    return [];
  }
  const chunks = [];
  let chunkAtual = "";
  for (const bloco of blocos) {
    if (chunkAtual.length > 0 && chunkAtual.length + bloco.length > CHUNK_SIZE) {
      chunks.push(criarChunk(chunkAtual, filename, chunks.length));
      const overlap = chunkAtual.slice(-CHUNK_OVERLAP);
      chunkAtual = overlap + "\n\n" + bloco;
    } else {
      chunkAtual += (chunkAtual.length > 0 ? "\n\n" : "") + bloco;
    }
  }
  if (chunkAtual.trim().length > 0) {
    chunks.push(criarChunk(chunkAtual, filename, chunks.length));
  }
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }
  console.log(
    `\u2702\uFE0F  [Chunking] "${filename}" dividido em ${chunks.length} chunks (alvo: ${CHUNK_SIZE}, overlap: ${CHUNK_OVERLAP})`
  );
  return chunks;
}
function criarChunk(conteudo, filename, index) {
  return {
    conteudo: conteudo.trim(),
    metadata: {
      filename,
      chunkIndex: index,
      totalChunks: 0
    }
  };
}
async function vetorizarEGravar(chunks) {
  let gravados = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const progresso = `[${i + 1}/${chunks.length}]`;
    try {
      console.log(
        `\u{1F522} [Embedding] ${progresso} Vetorizando: "${chunk.conteudo.substring(0, 40)}..."`
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
        `\u{1F4BE} [Banco] ${progresso} Chunk gravado (${embedding.length} dimens\xF5es)`
      );
    } catch (error) {
      console.error(
        `\u274C [Embedding] ${progresso} Erro:`,
        error instanceof Error ? error.message : error
      );
    }
  }
  return gravados;
}
async function processarDocumento(buffer, filename, mimetype = "application/pdf") {
  console.log(`
${"=".repeat(60)}`);
  console.log(`\u{1F680} [Ingest\xE3o] Processando "${filename}" (${mimetype})`);
  console.log(`${"=".repeat(60)}
`);
  const inicio = Date.now();
  const texto = await extrairTexto(buffer, filename, mimetype);
  if (texto.trim().length === 0) {
    return {
      mensagem: "O arquivo n\xE3o cont\xE9m texto extra\xEDvel.",
      arquivo: filename,
      totalChunks: 0,
      chunksGravados: 0
    };
  }
  const chunks = dividirEmChunks(texto, filename);
  const chunksGravados = await vetorizarEGravar(chunks);
  const duracao = ((Date.now() - inicio) / 1e3).toFixed(1);
  console.log(`
${"=".repeat(60)}`);
  console.log(
    `\u2705 [Ingest\xE3o] "${filename}" conclu\xEDdo em ${duracao}s \u2014 ${chunksGravados}/${chunks.length} chunks`
  );
  console.log(`${"=".repeat(60)}
`);
  return {
    mensagem: `Documento processado com sucesso em ${duracao}s.`,
    arquivo: filename,
    totalChunks: chunks.length,
    chunksGravados
  };
}
async function listarDocumentosProcessados() {
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
      ultimaAtualizacao: row.ultima_atualizacao
    }));
  } catch (error) {
    console.error("[Embedding] Erro ao listar documentos:", error);
    return [];
  }
}
async function removerDocumento(filename) {
  console.log(`\u{1F5D1}\uFE0F  [Remo\xE7\xE3o] Removendo "${filename}" do banco...`);
  const result = await pool.query(
    `DELETE FROM documents WHERE metadata->>'filename' = $1`,
    [filename]
  );
  const removidos = result.rowCount ?? 0;
  console.log(`\u{1F5D1}\uFE0F  [Remo\xE7\xE3o] ${removidos} chunks removidos`);
  return removidos;
}

// src/controllers/embedding.controller.ts
var TIPOS_ACEITOS = ["application/pdf"];
async function uploadDocumento(req, res) {
  try {
    const arquivo = req.file;
    if (!arquivo) {
      res.status(400).json({
        erro: "Nenhum arquivo foi enviado. Envie um PDF no campo 'arquivo'."
      });
      return;
    }
    if (!TIPOS_ACEITOS.includes(arquivo.mimetype)) {
      res.status(400).json({
        erro: `Tipo de arquivo n\xE3o suportado: ${arquivo.mimetype}. Aceito: PDF.`
      });
      return;
    }
    const MAX_SIZE = 20 * 1024 * 1024;
    if (arquivo.size > MAX_SIZE) {
      res.status(400).json({
        erro: `Arquivo muito grande (${(arquivo.size / 1024 / 1024).toFixed(1)} MB). M\xE1ximo: 20 MB.`
      });
      return;
    }
    console.log(
      `\u{1F4E4} [Upload] Recebido: "${arquivo.originalname}" (${(arquivo.size / 1024).toFixed(0)} KB)`
    );
    const resultado = await processarDocumento(
      arquivo.buffer,
      arquivo.originalname
    );
    res.status(200).json(resultado);
  } catch (error) {
    console.error("[EmbeddingController] Erro no upload:", error);
    const mensagemErro = error instanceof Error && error.message.includes("Ollama") ? "O servidor Ollama est\xE1 offline. Verifique se est\xE1 rodando e tente novamente." : "Erro interno ao processar o documento. Tente novamente.";
    res.status(500).json({ erro: mensagemErro });
  }
}
async function listarDocumentos(_req, res) {
  try {
    const documentos = await listarDocumentosProcessados();
    res.status(200).json({ documentos });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao listar documentos:", error);
    res.status(500).json({ erro: "Erro ao listar documentos processados." });
  }
}
async function deletarDocumento(req, res) {
  try {
    const { filename } = req.params;
    if (!filename) {
      res.status(400).json({ erro: "Nome do arquivo n\xE3o fornecido." });
      return;
    }
    const removidos = await removerDocumento(filename);
    if (removidos === 0) {
      res.status(404).json({ erro: "Documento n\xE3o encontrado no banco." });
      return;
    }
    res.status(200).json({
      mensagem: `Documento '${filename}' removido com sucesso.`,
      chunksRemovidos: removidos
    });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao deletar documento:", error);
    res.status(500).json({ erro: "Erro ao excluir o documento." });
  }
}

// src/routes/embedding.routes.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
    // 20 MB
  }
});
var embeddingRouter = Router2();
embeddingRouter.post("/upload", upload.single("arquivo"), uploadDocumento);
embeddingRouter.get("/documentos", listarDocumentos);
embeddingRouter.delete("/documentos/:filename", deletarDocumento);

// src/routes/agent.routes.ts
import { Router as Router3 } from "express";

// src/services/mcp_agent.service.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
var OLLAMA_BASE_URL2 = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
var LLM_MODEL2 = process.env.OLLAMA_LLM_MODEL || "qwen3.5:latest";
var AGENT_SYSTEM_PROMPT = `Voc\xEA \xE9 o chatIFme, assistente virtual oficial do curso de Sistemas de Informa\xE7\xE3o do IFMG Campus Ouro Branco.

Voc\xEA tem acesso a uma ferramenta de busca nos documentos oficiais do curso. USE ESTA FERRAMENTA para responder perguntas sobre:
- Regulamentos acad\xEAmicos
- PPC (Projeto Pedag\xF3gico do Curso)
- Grade curricular e carga hor\xE1ria
- TCC, est\xE1gio, atividades complementares
- Normas do campus e informa\xE7\xF5es institucionais

REGRAS OBRIGAT\xD3RIAS:
1. SEMPRE use a ferramenta search_ifmg_knowledge antes de responder perguntas sobre o curso.
2. Use EXCLUSIVAMENTE as informa\xE7\xF5es retornadas pela ferramenta.
3. N\xC3O invente, suponha ou complemente com conhecimento externo.
4. Se a ferramenta n\xE3o retornar resultados relevantes, diga: "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do curso."
5. Cite a fonte (nome do documento) quando poss\xEDvel.
6. Responda sempre em portugu\xEAs brasileiro, de forma educada e organizada.
7. Para sauda\xE7\xF5es simples (ol\xE1, bom dia), responda diretamente sem usar a ferramenta.`;
var mcpClient = null;
var ollamaTools = [];
async function inicializarMCPClient() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const mcpServerPath = resolve(
      __dirname,
      "..",
      "..",
      "mcp-server",
      "dist",
      "index.js"
    );
    console.log(`\u{1F50C} [MCP Client] Conectando ao servidor: ${mcpServerPath}`);
    const transport = new StdioClientTransport({
      command: "node",
      args: [mcpServerPath],
      env: {
        ...process.env,
        // Propaga variáveis de ambiente para o subprocesso
        DATABASE_URL: process.env.DATABASE_URL || "",
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "",
        OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL || ""
      }
    });
    mcpClient = new Client(
      { name: "chatifme-agent", version: "1.0.0" },
      { capabilities: {} }
    );
    await mcpClient.connect(transport);
    console.log("\u2705 [MCP Client] Conectado ao servidor MCP");
    const { tools } = await mcpClient.listTools();
    console.log(
      `\u{1F527} [MCP Client] ${tools.length} ferramenta(s) dispon\xEDvel(is):`
    );
    tools.forEach((t) => console.log(`   \u2022 ${t.name}: ${t.description}`));
    ollamaTools = tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema
      }
    }));
  } catch (error) {
    console.error("\u274C [MCP Client] Falha ao conectar:", error);
    throw error;
  }
}
async function encerrarMCPClient() {
  if (mcpClient) {
    await mcpClient.close();
    console.log("\u{1F50C} [MCP Client] Desconectado");
  }
}
async function processarPerguntaAgente(pergunta, res) {
  if (!mcpClient) {
    throw new Error("[Agente] MCP Client n\xE3o inicializado");
  }
  console.log(`
${"\u2500".repeat(50)}`);
  console.log(`\u{1F916} [Agente] Nova pergunta: "${pergunta}"`);
  console.log(`${"\u2500".repeat(50)}`);
  const inicio = Date.now();
  const messages = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    { role: "user", content: pergunta }
  ];
  console.log(
    `\u{1F9E0} [Agente] Passo 1: Enviando ao Ollama com ${ollamaTools.length} ferramenta(s)...`
  );
  const firstResponse = await fetch(`${OLLAMA_BASE_URL2}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL2,
      messages,
      tools: ollamaTools,
      stream: false
    })
  });
  if (!firstResponse.ok) {
    const errorText = await firstResponse.text();
    throw new Error(`[Ollama] Erro ${firstResponse.status}: ${errorText}`);
  }
  const firstData = await firstResponse.json();
  const assistantMessage = firstData.message;
  if (!assistantMessage) {
    throw new Error("[Ollama] Resposta sem message");
  }
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    console.log(
      `\u{1F527} [Agente] Passo 2: Ollama solicitou ${assistantMessage.tool_calls.length} chamada(s) de ferramenta`
    );
    messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
      tool_calls: assistantMessage.tool_calls
    });
    const fontes = [];
    for (const toolCall of assistantMessage.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      console.log(
        `   \u{1F4DE} [Agente] Chamando ferramenta: ${name}(${JSON.stringify(args)})`
      );
      try {
        const toolResult = await mcpClient.callTool({
          name,
          arguments: args
        });
        const resultText = toolResult.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
        console.log(
          `   \u2705 [Agente] Resultado: ${resultText.substring(0, 80)}...`
        );
        const fontesMatch = resultText.match(
          /\(fonte: ([^,]+), similaridade/g
        );
        if (fontesMatch) {
          fontesMatch.forEach((f) => {
            const match = f.match(/fonte: ([^,]+)/);
            if (match)
              fontes.push(match[1]);
          });
        }
        messages.push({
          role: "tool",
          content: resultText
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`   \u274C [Agente] Erro ao executar ${name}: ${msg}`);
        messages.push({
          role: "tool",
          content: `Erro ao buscar documentos: ${msg}`
        });
      }
    }
    res.write(`data: ${JSON.stringify({ type: "fontes", fontes })}

`);
  } else {
    console.log(
      "\u{1F4AC} [Agente] Passo 2: Sem tool_calls \u2014 resposta direta"
    );
    messages.push({
      role: "assistant",
      content: assistantMessage.content || ""
    });
    res.write(
      `data: ${JSON.stringify({ type: "fontes", fontes: [] })}

`
    );
    if (assistantMessage.content) {
      res.write(
        `data: ${JSON.stringify({ type: "token", content: assistantMessage.content })}

`
      );
      res.write(`data: [DONE]

`);
      const duracao2 = ((Date.now() - inicio) / 1e3).toFixed(1);
      console.log(
        `\u23F1\uFE0F  [Agente] Pipeline conclu\xEDdo em ${duracao2}s (sem ferramentas)
`
      );
      return;
    }
  }
  console.log("\u{1F30A} [Agente] Passo 3: Gerando resposta final com streaming...");
  const streamResponse = await fetch(`${OLLAMA_BASE_URL2}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL2,
      messages,
      stream: true
    })
  });
  if (!streamResponse.ok) {
    const errorText = await streamResponse.text();
    throw new Error(
      `[Ollama Stream] Erro ${streamResponse.status}: ${errorText}`
    );
  }
  if (!streamResponse.body) {
    throw new Error("[Ollama Stream] Corpo da resposta vazio");
  }
  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
          continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (chunk.message?.content) {
            res.write(
              `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`
            );
          }
          if (chunk.done) {
            console.log("\u{1F916} [Agente] Gera\xE7\xE3o conclu\xEDda pelo Ollama");
          }
        } catch {
        }
      }
    }
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim());
        if (chunk.message?.content) {
          res.write(
            `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`
          );
        }
      } catch {
      }
    }
  } finally {
    reader.releaseLock();
  }
  res.write(`data: [DONE]

`);
  const duracao = ((Date.now() - inicio) / 1e3).toFixed(1);
  console.log(`\u23F1\uFE0F  [Agente] Pipeline streaming conclu\xEDdo em ${duracao}s
`);
}

// src/controllers/agent.controller.ts
async function enviarPerguntaAgente(req, res) {
  try {
    const { pergunta } = req.body;
    if (!pergunta || typeof pergunta !== "string") {
      res.status(400).json({
        erro: "O campo 'pergunta' \xE9 obrigat\xF3rio e deve ser uma string."
      });
      return;
    }
    const perguntaTrimmed = pergunta.trim();
    if (perguntaTrimmed.length < 3) {
      res.status(400).json({
        erro: "A pergunta deve ter pelo menos 3 caracteres."
      });
      return;
    }
    if (perguntaTrimmed.length > 1e3) {
      res.status(400).json({
        erro: "A pergunta deve ter no m\xE1ximo 1000 caracteres."
      });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    req.on("close", () => {
      console.log("\u{1F50C} [SSE Agent] Cliente desconectou");
    });
    await processarPerguntaAgente(perguntaTrimmed, res);
    res.end();
  } catch (error) {
    console.error("[AgentController] Erro:", error);
    if (res.headersSent) {
      const mensagemErro = error instanceof Error && error.message.includes("Ollama") ? "O servidor de IA ficou inacess\xEDvel. Tente novamente." : "Ocorreu um erro durante a gera\xE7\xE3o da resposta.";
      res.write(
        `data: ${JSON.stringify({ type: "erro", mensagem: mensagemErro })}

`
      );
      res.end();
    } else {
      res.status(500).json({
        erro: "Erro interno ao processar sua pergunta."
      });
    }
  }
}

// src/routes/agent.routes.ts
var agentRouter = Router3();
agentRouter.post("/", enviarPerguntaAgente);

// src/server.ts
var app = express();
var PORT = Number(process.env.PORT) || 3333;
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  })
);
app.use(express.json());
app.use("/api/chat", chatRouter);
app.use("/api/agent", agentRouter);
app.use("/api/embedding", embeddingRouter);
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var server = app.listen(PORT, async () => {
  console.log(`
\u{1F680} Servidor rodando em http://localhost:${PORT}`);
  console.log(`\u{1F4E1} Chat (RAG):         POST http://localhost:${PORT}/api/chat`);
  console.log(`\u{1F916} Agent (MCP):        POST http://localhost:${PORT}/api/agent`);
  console.log(`\u{1F4E4} Upload endpoint:    POST http://localhost:${PORT}/api/embedding/upload`);
  console.log(`\u{1F4CB} Documentos:         GET  http://localhost:${PORT}/api/embedding/documentos`);
  console.log(`\u{1F49A} Health check:       GET  http://localhost:${PORT}/api/health
`);
  await testarConexaoDB();
  await verificarOllama();
  try {
    await inicializarMCPClient();
  } catch (error) {
    console.error("\u26A0\uFE0F  MCP Client n\xE3o dispon\xEDvel \u2014 rota /api/agent inoperante");
  }
  console.log("");
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `
\u274C Porta ${PORT} j\xE1 est\xE1 em uso. Encerre o processo anterior ou use outra porta:
   npx kill-port ${PORT}
`
    );
    process.exit(1);
  }
  throw err;
});
process.on("SIGINT", async () => {
  await encerrarMCPClient();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await encerrarMCPClient();
  process.exit(0);
});
//# sourceMappingURL=server.js.map