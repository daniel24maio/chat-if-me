import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.routes.js";
import { embeddingRouter } from "./routes/embedding.routes.js";
import { agentRouter } from "./routes/agent.routes.js";
import { testarConexaoDB } from "./config/database.js";
import { verificarOllama } from "./config/ollama.js";
import {
  inicializarMCPClient,
  encerrarMCPClient,
} from "./services/mcp_agent.service.js";

/**
 * Arquivo principal de inicialização do servidor.
 *
 * Responsabilidades:
 *   - Carregar variáveis de ambiente (.env)
 *   - Configurar middlewares globais (CORS, JSON parser)
 *   - Registrar os módulos de rotas
 *   - Testar conexões externas (PostgreSQL, Ollama)
 *   - Iniciar o servidor HTTP na porta configurada
 */

const app = express();

// Porta configurável via variável de ambiente (padrão: 3333)
const PORT = Number(process.env.PORT) || 3333;

// ---------------------------------------------------------------------------
// Middlewares globais
// ---------------------------------------------------------------------------

/**
 * CORS: permite requisições do frontend.
 * Em produção, restringir a origin para o domínio específico do frontend.
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  })
);

/** Parser de JSON para processar o body das requisições POST */
app.use(express.json());

// ---------------------------------------------------------------------------
// Registro de rotas
// ---------------------------------------------------------------------------

/** Rotas do módulo de chat (assistente virtual RAG) */
app.use("/api/chat", chatRouter);

/** Rotas do agente MCP (Agentic RAG com Tool Calling) */
app.use("/api/agent", agentRouter);

/** Rotas do módulo de ingestão de documentos (embedding) */
app.use("/api/embedding", embeddingRouter);

/** Rota de health check para verificar se a API está no ar */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Inicialização do servidor
// ---------------------------------------------------------------------------

const server = app.listen(PORT, async () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 Chat (RAG):         POST http://localhost:${PORT}/api/chat`);
  console.log(`🤖 Agent (MCP):        POST http://localhost:${PORT}/api/agent`);
  console.log(`📤 Upload endpoint:    POST http://localhost:${PORT}/api/embedding/upload`);
  console.log(`📋 Documentos:         GET  http://localhost:${PORT}/api/embedding/documentos`);
  console.log(`💚 Health check:       GET  http://localhost:${PORT}/api/health\n`);

  // Testa conexões externas (não bloqueia a subida do servidor)
  await testarConexaoDB();
  await verificarOllama();

  // Inicializa o MCP Client (conecta ao servidor como subprocesso)
  try {
    await inicializarMCPClient();
  } catch (error) {
    console.error("⚠️  MCP Client não disponível — rota /api/agent inoperante");
  }

  console.log(""); // Linha em branco após os testes
});

// Tratamento de erro de porta em uso (comum no modo watch do tsup)
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n❌ Porta ${PORT} já está em uso. Encerre o processo anterior ou use outra porta:\n` +
      `   npx kill-port ${PORT}\n`
    );
    process.exit(1);
  }
  throw err;
});

// Cleanup: encerra o MCP Client quando o processo termina
process.on("SIGINT", async () => {
  await encerrarMCPClient();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await encerrarMCPClient();
  process.exit(0);
});
