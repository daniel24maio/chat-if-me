import type { Request, Response } from "express";
import type { ChatRequestBody } from "../interfaces/chat.interfaces.js";
import { processAgentBetaQuestionStream } from "../services/mcp_agent_beta.service.js";
import { withConcurrencyControl } from "../services/queue.service.js";

/**
 * Controller do Agente MCP Beta (Otimizado).
 *
 * Mesma interface SSE de /api/chat e /api/agent, mas direciona ao
 * novo pipeline otimizado do Agente Beta para os experimentos de precisão.
 *
 * Endpoint: POST /api/agent-beta
 */
export async function sendAgentBetaQuestion(
  req: Request<object, unknown, ChatRequestBody>,
  res: Response
): Promise<void> {
  try {
    const { question, sessionId } = req.body;

    // Validação: campo obrigatório
    if (!question || typeof question !== "string") {
      res.status(400).json({
        error: "O campo 'question' é obrigatório e deve ser uma string.",
      });
      return;
    }

    // Validação: tamanho mínimo
    const questionTrimmed = question.trim();
    if (questionTrimmed.length < 3) {
      res.status(400).json({
        error: "A pergunta deve ter pelo menos 3 caracteres.",
      });
      return;
    }

    // Validação: tamanho máximo
    if (questionTrimmed.length > 1000) {
      res.status(400).json({
        error: "A pergunta deve ter no máximo 1000 caracteres.",
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

    req.on("close", () => {
      console.log("🔌 [SSE Agent Beta] Cliente desconectou");
    });

    // Executa com controle de concorrência no semáforo Ollama
    await withConcurrencyControl(async () => {
      await processAgentBetaQuestionStream(questionTrimmed, res, sessionId);
    });

    res.end();
  } catch (error) {
    console.error("[AgentBetaController] Erro:", error);

    if (res.headersSent) {
      const errorMessage =
        error instanceof Error && error.message.includes("Ollama")
          ? "O servidor de IA ficou inacessível. Tente novamente."
          : "Ocorreu um erro durante o processamento no Agente Beta.";

      res.write(
        `data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`
      );
      res.end();
    } else {
      res.status(500).json({
        error: "Erro interno ao processar sua pergunta no modo Beta.",
      });
    }
  }
}
