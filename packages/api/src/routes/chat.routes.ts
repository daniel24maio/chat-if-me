import { Router } from "express";
import { sendQuestion, registerFeedback, getLastSessionInteraction } from "../controllers/chat.controller.js";
import { chatLimiter } from "../middlewares/rateLimiter.js";

/**
 * Rotas do módulo de chat.
 *
 * Decisão de projeto: isolar as rotas em arquivos separados por domínio
 * permite escalar a API com novos módulos (ex.: autenticação, feedback)
 * sem poluir o arquivo principal.
 */
const chatRouter = Router();

/**
 * POST /api/chat
 * Recebe a pergunta do aluno e retorna a resposta do assistente virtual.
 *
 * Body esperado: { "question": "string" }
 * Resposta: { "response": "string", "sources": ["string"] }
 */
chatRouter.post("/", sendQuestion);

/**
 * GET /api/chat/last?sessionId=...
 * Recupera a última interação gerada para a sessão se gerada nos últimos 5 minutos.
 */
chatRouter.get("/last", chatLimiter, getLastSessionInteraction);

/**
 * POST /api/chat/feedback
 * Registra o feedback (👍 ou 👎) para uma resposta do assistente.
 */
chatRouter.post("/feedback", registerFeedback);

export { chatRouter };
