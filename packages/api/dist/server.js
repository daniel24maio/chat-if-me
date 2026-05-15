// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// src/routes/chat.routes.ts
import { Router } from "express";

// src/config/database.ts
import pg from "pg";
var { Pool } = pg;
var EMBEDDING_DIM_ESPERADA = 1024;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  // Máximo de conexões simultâneas
  idleTimeoutMillis: 3e4,
  // Fecha conexões ociosas após 30s
  connectionTimeoutMillis: 5e3
  // Timeout para obter conexão do pool
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
async function verificarDimensaoEmbedding() {
  try {
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'documents'
      ) AS existe
    `);
    if (!tabelaExiste.rows[0]?.existe) {
      console.log("\u23ED\uFE0F  [Database] Tabela 'documents' n\xE3o existe ainda. Pulando verifica\xE7\xE3o de dimens\xE3o.");
      return;
    }
    const result = await pool.query(`
      SELECT atttypmod AS dim
      FROM pg_attribute
      WHERE attrelid = 'documents'::regclass
        AND attname = 'embedding'
    `);
    if (result.rows.length === 0) {
      console.warn("\u26A0\uFE0F  [Database] Coluna 'embedding' n\xE3o encontrada na tabela 'documents'.");
      return;
    }
    const dimAtual = result.rows[0].dim;
    if (dimAtual === EMBEDDING_DIM_ESPERADA) {
      console.log(`\u2705 [Database] Dimens\xE3o do embedding: ${dimAtual}d \u2713`);
      return;
    }
    console.warn(
      `\u26A0\uFE0F  [Database] Dimens\xE3o incompat\xEDvel detectada: ${dimAtual}d (esperado: ${EMBEDDING_DIM_ESPERADA}d)`
    );
    console.log(`\u{1F504} [Database] Iniciando auto-migra\xE7\xE3o ${dimAtual}d \u2192 ${EMBEDDING_DIM_ESPERADA}d...`);
    const countResult = await pool.query(`SELECT COUNT(*) AS total FROM documents WHERE embedding IS NOT NULL`);
    const registrosExistentes = Number(countResult.rows[0]?.total || 0);
    if (registrosExistentes > 0) {
      console.warn(
        `\u26A0\uFE0F  [Database] ${registrosExistentes} registro(s) com embeddings ser\xE3o invalidados. Re-uploade os documentos ap\xF3s a migra\xE7\xE3o.`
      );
    }
    await pool.query(`DROP INDEX IF EXISTS idx_documents_embedding`);
    await pool.query(`ALTER TABLE documents DROP COLUMN IF EXISTS embedding`);
    await pool.query(`ALTER TABLE documents ADD COLUMN embedding vector(${EMBEDDING_DIM_ESPERADA})`);
    await pool.query(`
      CREATE INDEX idx_documents_embedding
        ON documents USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 200)
    `);
    console.log(
      `\u2705 [Database] Auto-migra\xE7\xE3o conclu\xEDda! Embedding agora \xE9 ${EMBEDDING_DIM_ESPERADA}d (HNSW).`
    );
    if (registrosExistentes > 0) {
      console.warn(
        `\u26A0\uFE0F  [Database] A\xC7\xC3O NECESS\xC1RIA: Re-uploade os ${registrosExistentes} documento(s) via /api/embedding/upload`
      );
    }
  } catch (error) {
    console.error(
      "\u274C [Database] Falha na verifica\xE7\xE3o/migra\xE7\xE3o de dimens\xE3o:",
      error instanceof Error ? error.message : error
    );
  }
}

// src/config/ollama.ts
var OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
var EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "bge-m3";
var LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:2b-q4_K_M";
var REWRITE_MODEL = process.env.OLLAMA_REWRITE_MODEL || "qwen3.5:2b-q4_K_M";
var NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 4096;
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
        temperature: 0,
        // Determinístico — sem criatividade na reescrita
        num_ctx: NUM_CTX
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
      stream: true,
      options: { num_ctx: NUM_CTX }
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
1. Classifique a inten\xE7\xE3o da pergunta e inicie a resposta com uma Tag de Inten\xE7\xE3o:
   - [CURSO]: D\xFAvidas sobre o projeto pedag\xF3gico, regras gerais, est\xE1gios, TCC.
   - [DISCIPLINA]: D\xFAvidas sobre nomes de mat\xE9rias, c\xF3digos, carga hor\xE1ria, pr\xE9-requisitos.
   - [CONTEUDO]: D\xFAvidas espec\xEDficas sobre a ementa ou t\xF3picos ensinados dentro de uma disciplina.
   - [OUTRAS]: D\xFAvidas administrativas, infraestrutura do campus, portarias, calend\xE1rio.
2. Expanda TODAS as siglas acad\xEAmicas:
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
3. Transforme linguagem coloquial em linguagem formal/acad\xEAmica.
4. Adicione contexto impl\xEDcito quando cab\xEDvel (ex: "reprovar" \u2192 "crit\xE9rios de reprova\xE7\xE3o").
5. Mantenha o sentido original da pergunta.
6. Responda APENAS com a Tag de Inten\xE7\xE3o seguida da pergunta reescrita, sem aspas. Exemplo: "[DISCIPLINA] qual \xE9 a carga hor\xE1ria de c\xE1lculo 1?"`;
async function reescreverPergunta(pergunta) {
  try {
    console.log(`\u270D\uFE0F  [Reescrita] Original: "${pergunta}"`);
    const reescrita = await reescreverComLLM(REWRITE_SYSTEM_PROMPT, pergunta);
    if (!reescrita || reescrita.length > 1e3) {
      console.log(`\u270D\uFE0F  [Reescrita] Resultado inv\xE1lido, usando original.`);
      return { intencao: "OUTRAS", perguntaReescrita: pergunta };
    }
    const match = reescrita.trim().match(/^\[(.*?)\]\s*(.*)/);
    if (match) {
      const intencao = match[1].toUpperCase();
      const perguntaReescrita = match[2];
      console.log(`\u270D\uFE0F  [Reescrita] Inten\xE7\xE3o: [${intencao}] | Reescrita: "${perguntaReescrita}"`);
      return { intencao, perguntaReescrita };
    }
    console.log(`\u270D\uFE0F  [Reescrita] Resultado sem tag: "${reescrita}"`);
    return { intencao: "OUTRAS", perguntaReescrita: reescrita };
  } catch (error) {
    console.warn(
      `\u26A0\uFE0F  [Reescrita] Falha na reescrita, usando pergunta original:`,
      error instanceof Error ? error.message : error
    );
    return { intencao: "OUTRAS", perguntaReescrita: pergunta };
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
function montarMensagensRAG(pergunta, documentos, intencao) {
  const contexto = documentos.length > 0 ? documentos.map(
    (doc, i) => `--- Trecho ${i + 1} (fonte: ${doc.origem}, similaridade: ${doc.similaridade.toFixed(2)}) ---
${doc.conteudo}`
  ).join("\n\n") : "Nenhum documento relevante foi encontrado na base de conhecimento.";
  const systemPrompt = `Voc\xEA \xE9 o assistente virtual oficial do IFMG Campus Ouro Branco.

Sua fun\xE7\xE3o \xE9 responder d\xFAvidas dos alunos sobre regulamentos, PPC (Projeto Pedag\xF3gico do Curso), grade curricular, normas acad\xEAmicas e informa\xE7\xF5es do campus.

INTEN\xC7\xC3O DA PERGUNTA: [${intencao}] (Foque a sua resposta no contexto dessa inten\xE7\xE3o).

REGRAS OBRIGAT\xD3RIAS (siga rigorosamente):
1. Use EXCLUSIVAMENTE as informa\xE7\xF5es dos trechos de documentos fornecidos abaixo.
2. N\xC3O invente, suponha ou complemente com conhecimento externo.
3. Se a resposta n\xE3o estiver nos trechos, diga: "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do curso ou acessar o portal do IFMG."
4. Cite a fonte (nome do documento) quando poss\xEDvel.

DIRETIVAS DE IDIOMA E FORMATA\xC7\xC3O:
- REGRA ABSOLUTA: Voc\xEA deve responder EXCLUSIVAMENTE em Portugu\xEAs do Brasil (pt-BR). Traduza qualquer termo do contexto que esteja em ingl\xEAs.
- Seja direto, cordial e acad\xEAmico. Nunca invente informa\xE7\xF5es.
- Use '### ' para subt\xEDtulos.
- Use bullet points ('* ') para listar disciplinas, cargas hor\xE1rias ou t\xF3picos.
- Use **negrito** para destacar nomes de cursos, regras e n\xFAmeros importantes.

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
  const t0 = Date.now();
  const { intencao, perguntaReescrita } = await reescreverPergunta(pergunta);
  const rewriteMs = Date.now() - t0;
  const t1 = Date.now();
  const embedding = await gerarEmbedding(perguntaReescrita);
  const embedMs = Date.now() - t1;
  const t2 = Date.now();
  const documentos = await buscarHibrido(embedding, perguntaReescrita);
  const retrievalMs = Date.now() - t2;
  const fontes = documentos.map(
    (doc) => `${doc.origem} (similaridade: ${doc.similaridade.toFixed(2)})`
  );
  const mensagens = montarMensagensRAG(pergunta, documentos, intencao);
  console.log(
    `\u{1F916} [RAG] Iniciando streaming com ${documentos.length} documentos de contexto...`
  );
  const t3 = Date.now();
  await streamRespostaOllama(mensagens, res, fontes);
  const generationMs = Date.now() - t3;
  const totalMs = Date.now() - inicio;
  const timings = {
    rewrite: rewriteMs,
    embedding: embedMs,
    retrieval: retrievalMs,
    generation: generationMs,
    total: totalMs
  };
  res.write(`data: ${JSON.stringify({ type: "metrics", timings })}

`);
  console.log(
    `\u23F1\uFE0F  [RAG] Pipeline conclu\xEDdo em ${(totalMs / 1e3).toFixed(1)}s (rewrite: ${rewriteMs}ms, embed: ${embedMs}ms, retrieval: ${retrievalMs}ms, gen: ${generationMs}ms)
`
  );
}

// src/services/queue.service.ts
var MAX_CONCURRENT = Number(process.env.OLLAMA_MAX_CONCURRENT) || 2;
var QUEUE_TIMEOUT_MS = 12e4;
var OllamaSemaphore = class {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
  }
  currentCount = 0;
  waitQueue = [];
  /**
   * Aguarda até que um slot esteja disponível.
   * @throws Error se o timeout for atingido
   */
  async acquire() {
    if (this.currentCount < this.maxConcurrent) {
      this.currentCount++;
      return;
    }
    return new Promise((resolve2, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waitQueue.findIndex((w) => w.resolve === resolve2);
        if (idx !== -1)
          this.waitQueue.splice(idx, 1);
        reject(new Error("Tempo de espera na fila esgotado. Tente novamente."));
      }, QUEUE_TIMEOUT_MS);
      this.waitQueue.push({ resolve: resolve2, timer });
    });
  }
  /** Libera um slot, desbloqueando o próximo request na fila. */
  release() {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      clearTimeout(next.timer);
      next.resolve();
    } else {
      this.currentCount = Math.max(0, this.currentCount - 1);
    }
  }
  /** Retorna métricas da fila para observabilidade. */
  getStatus() {
    return {
      active: this.currentCount,
      waiting: this.waitQueue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
};
var ollamaSemaphore = new OllamaSemaphore(MAX_CONCURRENT);
async function comControleDeConcorrencia(fn) {
  await ollamaSemaphore.acquire();
  try {
    return await fn();
  } finally {
    ollamaSemaphore.release();
  }
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
    await comControleDeConcorrencia(async () => {
      await processarPerguntaStream(perguntaTrimmed, res);
    });
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
import mammoth from "mammoth";
import xlsx from "xlsx";

// src/services/sanitization.service.ts
var RE = {
  // Marcadores de página inseridos pela extração: "--- Página 5 ---"
  marcadorPagina: /---\s*P[aá]gina\s+\d+\s*---/gi,
  // Pilcrow (¶) e variantes de caracteres de formatação de parágrafo de PDF
  pilcrow: /[¶§]/g,
  // Superíndices e subíndices numéricos unicode (notas de rodapé, unidades)
  superSubIndices: /[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g,
  // Hifenização de palavras no final de linha: "infor-\nmação" → "informação"
  hifenQuebraDeLinha: /(\w)-\n(\w)/g,
  // Separadores decorativos de linha: "||", "| |", "___", "---", "==="
  separadoresDecorativos: /^[\s|_\-=]{3,}$/gm,
  // Linhas que são só pipe e espaço (resíduo de tabela sem conteúdo)
  linhasSoPipe: /^\s*\|[\s|]*\|\s*$/gm,
  // Múltiplos espaços e tabs → espaço único
  espacosMultiplos: /[ \t]{2,}/g,
  // Mais de 2 quebras de linha consecutivas → parágrafo duplo
  quebrasDeLinhaTriplas: /\n{3,}/g,
  // Linhas com menos de 3 caracteres não-espaço (ruído puro)
  linhasRuido: /^.{0,2}\n/gm,
  // Caracteres de controle não-visíveis (exceto \n e \t)
  caracteresControle: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
  // Aspas tipográficas → ASCII
  aspasCurvas: /[\u201C\u201D]/g,
  aspasSimples: /[\u2018\u2019]/g,
  travessao: /[\u2013\u2014]/g,
  // Sequências de pontuação repetida decorativa: ".....", "-----"
  pontuacaoRepetida: /([.!?=\-_])\1{3,}/g,
  // Número de página solto: linha com apenas 1-4 dígitos
  numeroPaginaSolto: /^\s*\d{1,4}\s*$/gm
};
function tabelaMarkdownParaTexto(linha) {
  if (!linha.includes("|"))
    return linha;
  if (/^\|[\s\-:|]+\|/.test(linha))
    return "";
  return linha.split("|").map((c) => c.trim()).filter((c) => c.length > 0 && !/^[-:]+$/.test(c)).join(" ");
}
function normalizarLinhasTabela(texto) {
  return texto.split("\n").map(
    (linha) => linha.includes("|") ? tabelaMarkdownParaTexto(linha) : linha
  ).filter((l) => l.trim().length > 0).join("\n");
}
function sanitizarTexto(texto) {
  const tamanhoOriginal = texto.length;
  let r = texto;
  r = r.replace(RE.hifenQuebraDeLinha, "$1$2");
  r = r.replace(RE.marcadorPagina, "");
  r = r.replace(RE.caracteresControle, "");
  r = r.replace(RE.pilcrow, "");
  r = r.replace(RE.superSubIndices, "");
  r = r.replace(RE.separadoresDecorativos, "");
  r = normalizarLinhasTabela(r);
  r = r.replace(RE.numeroPaginaSolto, "");
  r = r.replace(RE.pontuacaoRepetida, "$1");
  r = r.replace(RE.aspasCurvas, '"');
  r = r.replace(RE.aspasSimples, "'");
  r = r.replace(RE.travessao, "-");
  r = r.replace(RE.espacosMultiplos, " ");
  r = r.replace(RE.linhasRuido, "");
  r = r.replace(RE.quebrasDeLinhaTriplas, "\n\n");
  r = r.trim();
  const reducao = ((tamanhoOriginal - r.length) / tamanhoOriginal * 100).toFixed(1);
  console.log(
    `\u{1F9F9} [Sanitiza\xE7\xE3o] ${tamanhoOriginal} \u2192 ${r.length} chars (redu\xE7\xE3o: ${reducao}%)`
  );
  return r;
}

// src/services/embedding.service.ts
var CHUNK_CONFIGS = {
  regulamento: { size: 1024, overlap: 128 },
  // ~256 tokens — granular para artigos
  tabela: { size: 8e3, overlap: 0 },
  // chunk inteiro — não quebrar tabelas
  default: { size: 2048, overlap: 256 }
  // ~512 tokens — texto corrido
};
function detectarTipoConteudo(texto, filename) {
  if (/regulament|norma|resolu[çc]|portaria|edital|delibera/i.test(filename)) {
    return "regulamento";
  }
  const pipeCount = (texto.match(/\|/g) || []).length;
  if (pipeCount > 20 && texto.includes("|")) {
    return "tabela";
  }
  return "default";
}
var EMBEDDING_MAX_CHARS = 4e3;
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
async function extrairTextoWord(buffer, filename) {
  console.log(`\u{1F4DD} [Extra\xE7\xE3o] Iniciando extra\xE7\xE3o de documento Word "${filename}"...`);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
async function extrairTextoPlanilha(buffer, filename) {
  console.log(`\u{1F4CA} [Extra\xE7\xE3o] Iniciando extra\xE7\xE3o de planilha "${filename}"...`);
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const planilhas = [];
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length === 0)
      continue;
    const result = [];
    const maxCols = Math.max(...data.map((row) => row.length));
    for (let i = 0; i < data.length; i++) {
      const row = data[i] || [];
      while (row.length < maxCols)
        row.push("");
      const formattedRow = row.map((cell) => String(cell ?? "").replace(/[\n\r\|]/g, " ").trim());
      result.push(`| ${formattedRow.join(" | ")} |`);
      if (i === 0) {
        result.push(`| ${formattedRow.map(() => "---").join(" | ")} |`);
      }
    }
    planilhas.push(`--- Planilha: ${sheetName} ---
${result.join("\n")}`);
  }
  return planilhas.join("\n\n");
}
async function extrairTexto(buffer, filename, mimetype) {
  const nomeLower = filename.toLowerCase();
  if (mimetype === "application/pdf" || nomeLower.endsWith(".pdf")) {
    return extrairTextoPDF(buffer, filename);
  }
  if (mimetype.startsWith("image/") || nomeLower.match(/\.(png|jpe?g)$/)) {
    return extrairTextoImagem(buffer, filename);
  }
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimetype === "application/msword" || nomeLower.endsWith(".docx") || nomeLower.endsWith(".doc")) {
    return extrairTextoWord(buffer, filename);
  }
  if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimetype === "application/vnd.ms-excel" || mimetype === "text/csv" || nomeLower.endsWith(".xlsx") || nomeLower.endsWith(".xls") || nomeLower.endsWith(".csv")) {
    return extrairTextoPlanilha(buffer, filename);
  }
  if (mimetype === "text/plain" || nomeLower.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }
  throw new Error(`Formato n\xE3o suportado: ${mimetype}`);
}
function subdividirBloco(texto, maxChars) {
  if (texto.length <= maxChars)
    return [texto];
  const partes = [];
  let restante = texto;
  while (restante.length > maxChars) {
    let corte = restante.lastIndexOf(". ", maxChars);
    if (corte === -1 || corte < maxChars * 0.5) {
      corte = restante.lastIndexOf("\n", maxChars);
    }
    if (corte === -1 || corte < maxChars * 0.5) {
      corte = maxChars;
    } else {
      corte += 1;
    }
    partes.push(restante.slice(0, corte).trim());
    restante = restante.slice(corte).trim();
  }
  if (restante.length > 0)
    partes.push(restante);
  return partes;
}
function dividirEmChunks(texto, filename) {
  const tipoConteudo = detectarTipoConteudo(texto, filename);
  const config = CHUNK_CONFIGS[tipoConteudo] || CHUNK_CONFIGS.default;
  const { size: chunkSize, overlap: chunkOverlap } = config;
  const blocos = texto.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  if (blocos.length === 0) {
    console.warn(`\u26A0\uFE0F [Chunking] Texto vazio em "${filename}"`);
    return [];
  }
  const chunks = [];
  let chunkAtual = "";
  for (const bloco of blocos) {
    if (chunkAtual.length > 0 && chunkAtual.length + bloco.length > chunkSize) {
      for (const parte of subdividirBloco(chunkAtual, EMBEDDING_MAX_CHARS)) {
        chunks.push(criarChunk(parte, filename, chunks.length));
      }
      const overlap = chunkOverlap > 0 ? chunkAtual.slice(-chunkOverlap) : "";
      chunkAtual = overlap + (overlap ? "\n\n" : "") + bloco;
    } else {
      chunkAtual += (chunkAtual.length > 0 ? "\n\n" : "") + bloco;
    }
  }
  if (chunkAtual.trim().length > 0) {
    for (const parte of subdividirBloco(chunkAtual, EMBEDDING_MAX_CHARS)) {
      chunks.push(criarChunk(parte, filename, chunks.length));
    }
  }
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }
  console.log(
    `\u2702\uFE0F  [Chunking] "${filename}" \u2192 ${chunks.length} chunks (tipo: ${tipoConteudo}, alvo: ${chunkSize}, overlap: ${chunkOverlap}, max: ${EMBEDDING_MAX_CHARS})`
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
function truncarParaEmbedding(texto) {
  if (texto.length <= EMBEDDING_MAX_CHARS)
    return texto;
  console.warn(
    `\u26A0\uFE0F [Embedding] Chunk com ${texto.length} chars excede o limite (${EMBEDDING_MAX_CHARS}). Truncando.`
  );
  const corte = texto.lastIndexOf(". ", EMBEDDING_MAX_CHARS);
  return corte > EMBEDDING_MAX_CHARS * 0.5 ? texto.slice(0, corte + 1).trim() : texto.slice(0, EMBEDDING_MAX_CHARS).trim();
}
var BATCH_SIZE = 32;
async function vetorizarEGravar(chunks) {
  let gravados = 0;
  let errosDimensao = 0;
  let outrosErros = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchLabel = `[Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}]`;
    console.log(
      `\u{1F522} [Embedding] ${batchLabel} Processando ${batch.length} chunks em paralelo...`
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
          `\u{1F4BE} [Banco] ${progresso} Chunk gravado (${embedding.length} dimens\xF5es)`
        );
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
            console.error(
              `\u274C [Embedding] ERRO DE DIMENS\xC3O: O banco espera uma dimens\xE3o diferente do modelo.
   Detalhe: ${errMsg}
   Solu\xE7\xE3o: Reinicie a API \u2014 a auto-migra\xE7\xE3o corrigir\xE1 a dimens\xE3o.
   Alternativa: Execute manualmente: psql -f migrate_bge_m3.sql`
            );
          }
        } else {
          outrosErros++;
          console.error(`\u274C [Embedding] Erro no lote: ${errMsg}`);
        }
      }
    }
    if (errosDimensao > 0 && gravados === 0 && i + BATCH_SIZE >= chunks.length) {
      break;
    }
  }
  if (errosDimensao > 0 || outrosErros > 0) {
    console.error(
      `
\u{1F4CA} [Embedding] Resumo: ${gravados} gravados, ${errosDimensao} erros de dimens\xE3o, ${outrosErros} outros erros`
    );
    if (errosDimensao > 0) {
      console.error(
        `   \u{1F4A1} A dimens\xE3o do embedding no banco est\xE1 incompat\xEDvel com o modelo configurado.
   \u{1F4A1} Reinicie a API para auto-migrar, ou execute: psql -U chatifme -d chatifme -f migrate_bge_m3.sql`
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
  const textoRaw = await extrairTexto(buffer, filename, mimetype);
  if (textoRaw.trim().length === 0) {
    return {
      mensagem: "O arquivo n\xE3o cont\xE9m texto extra\xEDvel.",
      arquivo: filename,
      totalChunks: 0,
      chunksGravados: 0
    };
  }
  const texto = sanitizarTexto(textoRaw);
  const chunks = dividirEmChunks(texto, filename);
  const chunksGravados = await vetorizarEGravar(chunks);
  const duracao = ((Date.now() - inicio) / 1e3).toFixed(1);
  const falhas = chunks.length - chunksGravados;
  if (chunksGravados === 0 && chunks.length > 0) {
    console.error(`
${"=".repeat(60)}`);
    console.error(
      `\u274C [Ingest\xE3o] "${filename}" FALHOU em ${duracao}s \u2014 0/${chunks.length} chunks gravados`
    );
    console.error(`${"=".repeat(60)}
`);
    return {
      mensagem: `Falha na ingest\xE3o: nenhum chunk foi gravado (0/${chunks.length}). Poss\xEDvel causa: dimens\xE3o do embedding incompat\xEDvel com o banco de dados. Reinicie a API para executar a auto-migra\xE7\xE3o.`,
      arquivo: filename,
      totalChunks: chunks.length,
      chunksGravados: 0
    };
  }
  console.log(`
${"=".repeat(60)}`);
  if (falhas > 0) {
    console.warn(
      `\u26A0\uFE0F  [Ingest\xE3o] "${filename}" conclu\xEDdo com erros em ${duracao}s \u2014 ${chunksGravados}/${chunks.length} chunks (${falhas} falhas)`
    );
  } else {
    console.log(
      `\u2705 [Ingest\xE3o] "${filename}" conclu\xEDdo em ${duracao}s \u2014 ${chunksGravados}/${chunks.length} chunks`
    );
  }
  console.log(`${"=".repeat(60)}
`);
  return {
    mensagem: falhas > 0 ? `Documento processado parcialmente em ${duracao}s. ${falhas} chunk(s) falharam.` : `Documento processado com sucesso em ${duracao}s.`,
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
var TIPOS_ACEITOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // .docx
  "application/msword",
  // .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // .xlsx
  "application/vnd.ms-excel",
  // .xls
  "text/csv",
  // .csv
  "text/plain",
  // .txt
  "image/jpeg",
  // .jpg, .jpeg
  "image/png"
  // .png
];
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
        erro: `Tipo de arquivo n\xE3o suportado: ${arquivo.mimetype}. Aceitos: PDF, Word, Excel, CSV, TXT, Imagens.`
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
      arquivo.originalname,
      arquivo.mimetype
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
var EXTENSOES_ACEITAS = /\.(pdf|docx?|xlsx?|csv|txt|jpe?g|png)$/i;
var MIMES_ACEITOS = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png"
]);
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
    // 20 MB
  },
  fileFilter: (_req, file, cb) => {
    const mimeOk = MIMES_ACEITOS.has(file.mimetype);
    const extOk = EXTENSOES_ACEITAS.test(file.originalname);
    if (mimeOk && extOk) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo n\xE3o permitido: ${file.mimetype} (${file.originalname})`));
    }
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
var LLM_MODEL2 = process.env.OLLAMA_LLM_MODEL || "qwen3.5:2b-q4_K_M";
var NUM_CTX2 = Number(process.env.OLLAMA_NUM_CTX) || 4096;
var AGENT_SYSTEM_PROMPT = `Voc\xEA \xE9 o assistente virtual oficial do IFMG Campus Ouro Branco.

Voc\xEA tem acesso a uma ferramenta de busca nos documentos oficiais do curso. USE ESTA FERRAMENTA para responder perguntas sobre:
- Regulamentos acad\xEAmicos
- PPC (Projeto Pedag\xF3gico do Curso)
- Grade curricular e carga hor\xE1ria
- TCC, est\xE1gio, atividades complementares
- Normas do campus e informa\xE7\xF5es institucionais

REGRAS OBRIGAT\xD3RIAS:
1. SEMPRE use a ferramenta search_ifmg_knowledge antes de responder perguntas sobre o curso.
2. Na ferramenta de busca, voc\xEA DEVE classificar a inten\xE7\xE3o (intent) da pergunta (CURSO, DISCIPLINA, CONTEUDO ou OUTRAS).
3. Use EXCLUSIVAMENTE as informa\xE7\xF5es retornadas pela ferramenta.
4. N\xC3O invente, suponha ou complemente com conhecimento externo.
5. Se a ferramenta n\xE3o retornar resultados relevantes, diga: "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do curso."
6. Cite a fonte (nome do documento) quando poss\xEDvel.
7. Para sauda\xE7\xF5es simples (ol\xE1, bom dia), responda diretamente sem usar a ferramenta.

DIRETIVAS DE IDIOMA E FORMATA\xC7\xC3O:
- REGRA ABSOLUTA: Voc\xEA deve responder EXCLUSIVAMENTE em Portugu\xEAs do Brasil (pt-BR). Traduza qualquer termo do contexto que esteja em ingl\xEAs.
- Seja direto, cordial e acad\xEAmico. Nunca invente informa\xE7\xF5es.
- Use '### ' para subt\xEDtulos.
- Use bullet points ('* ') para listar disciplinas, cargas hor\xE1rias ou t\xF3picos.
- Use **negrito** para destacar nomes de cursos, regras e n\xFAmeros importantes.`;
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
      stream: false,
      options: { num_ctx: NUM_CTX2 }
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
      stream: true,
      options: { num_ctx: NUM_CTX2 }
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
    await comControleDeConcorrencia(async () => {
      await processarPerguntaAgente(perguntaTrimmed, res);
    });
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

// src/config/redis.ts
import IORedis from "ioredis";
var redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
);
async function testarConexaoRedis() {
  try {
    const pong = await redisConnection.ping();
    console.log(`\u2705 [Redis] Conectado \u2014 ${pong}`);
  } catch (error) {
    console.warn(
      "\u26A0\uFE0F  [Redis] N\xE3o dispon\xEDvel \u2014 fila de concorr\xEAncia desabilitada.",
      error instanceof Error ? error.message : error
    );
  }
}

// src/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";
var chatLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Muitas requisi\xE7\xF5es. Aguarde um momento e tente novamente."
  }
});
var uploadLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Limite de uploads atingido. Tente novamente em 1 minuto."
  }
});

// src/middlewares/adminAuth.ts
function adminAuth(req, res, next) {
  if (req.method === "GET") {
    next();
    return;
  }
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    next();
    return;
  }
  const provided = req.headers["x-api-key"];
  if (!provided || provided !== apiKey) {
    res.status(401).json({
      erro: "Acesso n\xE3o autorizado. Chave de API inv\xE1lida ou ausente."
    });
    return;
  }
  next();
}

// src/server.ts
var app = express();
var PORT = Number(process.env.PORT) || 3333;
var allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origem n\xE3o permitida pelo CORS: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);
app.use(express.json());
app.use("/api/chat", chatLimiter, chatRouter);
app.use("/api/agent", chatLimiter, agentRouter);
app.use("/api/embedding", uploadLimiter, adminAuth, embeddingRouter);
app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  try {
    await pool.query("SELECT 1");
    dbOk = true;
  } catch {
  }
  let ollamaStatus = { ok: false, models: [] };
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const r = await fetch(`${ollamaUrl}/api/tags`);
    const data = await r.json();
    ollamaStatus = { ok: true, models: data.models?.map((m) => m.name) || [] };
  } catch {
  }
  let redisOk = false;
  try {
    const pong = await redisConnection.ping();
    redisOk = pong === "PONG";
  } catch {
  }
  const queueStatus = ollamaSemaphore.getStatus();
  const allOk = dbOk && ollamaStatus.ok;
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbOk,
      ollama: ollamaStatus,
      redis: redisOk
    },
    queue: queueStatus,
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`
    }
  });
});
var server = app.listen(PORT, async () => {
  console.log(`
\u{1F680} Servidor rodando na porta ${PORT}`);
  console.log(`\u{1F4E1} Chat (RAG):         POST /api/chat`);
  console.log(`\u{1F916} Agent (MCP):        POST /api/agent`);
  console.log(`\u{1F4E4} Upload endpoint:    POST /api/embedding/upload`);
  console.log(`\u{1F4CB} Documentos:         GET  /api/embedding/documentos`);
  console.log(`\u{1F49A} Health check:       GET  /api/health
`);
  await testarConexaoDB();
  await verificarDimensaoEmbedding();
  await testarConexaoRedis();
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