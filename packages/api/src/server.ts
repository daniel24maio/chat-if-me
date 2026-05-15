import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.routes.js";
import { embeddingRouter } from "./routes/embedding.routes.js";
import { agentRouter } from "./routes/agent.routes.js";
import { pool, testarConexaoDB, verificarDimensaoEmbedding } from "./config/database.js";
import { verificarOllama } from "./config/ollama.js";
import { redisConnection, testarConexaoRedis } from "./config/redis.js";
import { chatLimiter, uploadLimiter } from "./middlewares/rateLimiter.js";
import { adminAuth } from "./middlewares/adminAuth.js";
import { ollamaSemaphore } from "./services/queue.service.js";
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
 * CORS: permite requisições apenas de origens autorizadas.
 * Configurável via CORS_ORIGINS (lista separada por vírgula).
 * Em produção, restringir ao domínio do Cloudflare.
 */
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (ex: curl, Postman, health checks)
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/** Parser de JSON para processar o body das requisições POST */
app.use(express.json());

// ---------------------------------------------------------------------------
// Registro de rotas
// ---------------------------------------------------------------------------

/** Rotas do módulo de chat (assistente virtual RAG) — rate limited */
app.use("/api/chat", chatLimiter, chatRouter);

/** Rotas do agente MCP (Agentic RAG com Tool Calling) — rate limited */
app.use("/api/agent", chatLimiter, agentRouter);

/** Rotas do módulo de ingestão de documentos — rate limited + admin auth */
app.use("/api/embedding", uploadLimiter, adminAuth, embeddingRouter);

/** Rota de health check expandida — status de todos os serviços */
app.get("/api/health", async (_req, res) => {
  // ── Database ──
  let dbOk = false;
  try {
    await pool.query("SELECT 1");
    dbOk = true;
  } catch { /* offline */ }

  // ── Ollama ──
  let ollamaStatus: { ok: boolean; models: string[] } = { ok: false, models: [] };
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const r = await fetch(`${ollamaUrl}/api/tags`);
    const data = (await r.json()) as { models?: { name: string }[] };
    ollamaStatus = { ok: true, models: data.models?.map((m) => m.name) || [] };
  } catch { /* offline */ }

  // ── Redis ──
  let redisOk = false;
  try {
    const pong = await redisConnection.ping();
    redisOk = pong === "PONG";
  } catch { /* offline */ }

  // ── Queue metrics ──
  const queueStatus = ollamaSemaphore.getStatus();

  const allOk = dbOk && ollamaStatus.ok;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbOk,
      ollama: ollamaStatus,
      redis: redisOk,
    },
    queue: queueStatus,
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
    },
  });
});

// ---------------------------------------------------------------------------
// Inicialização do servidor
// ---------------------------------------------------------------------------

const server = app.listen(PORT, async () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Chat (RAG):         POST /api/chat`);
  console.log(`🤖 Agent (MCP):        POST /api/agent`);
  console.log(`📤 Upload endpoint:    POST /api/embedding/upload`);
  console.log(`📋 Documentos:         GET  /api/embedding/documentos`);
  console.log(`💚 Health check:       GET  /api/health\n`);

  // Testa conexões externas (não bloqueia a subida do servidor)
  await testarConexaoDB();
  await verificarDimensaoEmbedding(); // Auto-migra 768→1024 se necessário
  await testarConexaoRedis();
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
