import { Router } from "express";
import { sendAgentBetaQuestion } from "../controllers/agent_beta.controller.js";

/**
 * Rotas do Agente MCP Beta (Agentic RAG Otimizado).
 * POST /api/agent-beta — processa pergunta via pipeline do Agente Beta com MCP.
 */
const agentBetaRouter = Router();

agentBetaRouter.post("/", sendAgentBetaQuestion);

export { agentBetaRouter };
