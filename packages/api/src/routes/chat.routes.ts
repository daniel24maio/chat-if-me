import { Router } from "express";
import { enviarPergunta, registerFeedback } from "../controllers/chat.controller.js";

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
 * Body esperado: { "pergunta": "string" }
 * Resposta: { "resposta": "string", "fontes": ["string"] }
 */
chatRouter.post("/", enviarPergunta);

/**
 * POST /api/chat/feedback
 * Registra o feedback (👍 ou 👎) para uma resposta do assistente.
 */
chatRouter.post("/feedback", registerFeedback);

export { chatRouter };
