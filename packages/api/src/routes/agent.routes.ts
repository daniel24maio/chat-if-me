import { Router } from "express";
import { enviarPerguntaAgente } from "../controllers/agent.controller.js";

/**
 * Rotas do Agente MCP (Agentic RAG).
 * POST /api/agent — processa pergunta via tool calling com MCP.
 */
const agentRouter = Router();

agentRouter.post("/", enviarPerguntaAgente);

export { agentRouter };
