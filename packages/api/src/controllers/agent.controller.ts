import type { Request, Response } from "express";
import type { ChatRequestBody } from "../interfaces/chat.interfaces.js";
import { processarPerguntaAgente } from "../services/mcp_agent.service.js";

/**
 * Controller do Agente MCP (Agentic RAG).
 *
 * Mesma interface SSE do chat.controller.ts, mas delega ao agente MCP
 * em vez do pipeline RAG clássico. Isso permite comparar as duas
 * abordagens no TCC mantendo o mesmo frontend.
 */

/**
 * Processa uma pergunta via Agente MCP com streaming SSE.
 *
 * Endpoint: POST /api/agent
 * Body: { "pergunta": "string" }
 * Resposta: SSE stream (mesmo protocolo do /api/chat)
 */
export async function enviarPerguntaAgente(
  req: Request<object, unknown, ChatRequestBody>,
  res: Response
): Promise<void> {
  try {
    const { pergunta } = req.body;

    // Validação: campo obrigatório
    if (!pergunta || typeof pergunta !== "string") {
      res.status(400).json({
        erro: "O campo 'pergunta' é obrigatório e deve ser uma string.",
      });
      return;
    }

    // Validação: tamanho mínimo
    const perguntaTrimmed = pergunta.trim();
    if (perguntaTrimmed.length < 3) {
      res.status(400).json({
        erro: "A pergunta deve ter pelo menos 3 caracteres.",
      });
      return;
    }

    // Validação: tamanho máximo
    if (perguntaTrimmed.length > 1000) {
      res.status(400).json({
        erro: "A pergunta deve ter no máximo 1000 caracteres.",
      });
      return;
    }

    // Configura headers SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Detecta desconexão do cliente
    req.on("close", () => {
      console.log("🔌 [SSE Agent] Cliente desconectou");
    });

    // Delega ao agente MCP
    await processarPerguntaAgente(perguntaTrimmed, res);

    res.end();
  } catch (error) {
    console.error("[AgentController] Erro:", error);

    if (res.headersSent) {
      const mensagemErro =
        error instanceof Error && error.message.includes("Ollama")
          ? "O servidor de IA ficou inacessível. Tente novamente."
          : "Ocorreu um erro durante a geração da resposta.";

      res.write(
        `data: ${JSON.stringify({ type: "erro", mensagem: mensagemErro })}\n\n`
      );
      res.end();
    } else {
      res.status(500).json({
        erro: "Erro interno ao processar sua pergunta.",
      });
    }
  }
}
