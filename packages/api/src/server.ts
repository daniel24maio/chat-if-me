import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.routes.js";

/**
 * Arquivo principal de inicialização do servidor.
 *
 * Responsabilidades:
 *   - Carregar variáveis de ambiente (.env)
 *   - Configurar middlewares globais (CORS, JSON parser)
 *   - Registrar os módulos de rotas
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

/** Rotas do módulo de chat (assistente virtual) */
app.use("/api/chat", chatRouter);

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

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`💚 Health check:  GET  http://localhost:${PORT}/api/health\n`);
});
