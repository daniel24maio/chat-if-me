// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// src/routes/chat.routes.ts
import { Router } from "express";

// src/services/rag.service.ts
async function gerarEmbedding(texto) {
  console.log(`[Embedding] Vetorizando texto: "${texto.substring(0, 50)}..."`);
  return [];
}
async function buscarDocumentosSimilares(embedding, limite = 5) {
  console.log(
    `[pgvector] Buscando ${limite} documentos similares (embedding de ${embedding.length} dimens\xF5es)`
  );
  return [];
}
async function gerarRespostaLLM(pergunta, documentos) {
  console.log(
    `[LLM] Gerando resposta para: "${pergunta.substring(0, 50)}..." com ${documentos.length} documentos de contexto`
  );
  return "Esta \xE9 uma resposta placeholder. O pipeline RAG completo ser\xE1 implementado nas pr\xF3ximas etapas.";
}
async function processarPergunta(pergunta) {
  const embedding = await gerarEmbedding(pergunta);
  const documentos = await buscarDocumentosSimilares(embedding);
  const resposta = await gerarRespostaLLM(pergunta, documentos);
  const fontes = documentos.map(
    (doc) => `${doc.origem} (similaridade: ${doc.similaridade.toFixed(2)})`
  );
  return { resposta, fontes };
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
    const resultado = await processarPergunta(perguntaTrimmed);
    res.status(200).json({
      resposta: resultado.resposta,
      fontes: resultado.fontes
    });
  } catch (error) {
    console.error("[ChatController] Erro ao processar pergunta:", error);
    res.status(500).json({
      erro: "Ocorreu um erro interno ao processar sua pergunta. Tente novamente mais tarde."
    });
  }
}

// src/routes/chat.routes.ts
var chatRouter = Router();
chatRouter.post("/", enviarPergunta);

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
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.listen(PORT, () => {
  console.log(`
\u{1F680} Servidor rodando em http://localhost:${PORT}`);
  console.log(`\u{1F4E1} Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`\u{1F49A} Health check:  GET  http://localhost:${PORT}/api/health
`);
});
//# sourceMappingURL=server.js.map