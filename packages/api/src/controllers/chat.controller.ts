import type { Request, Response } from "express";
import type { ChatRequestBody } from "../interfaces/chat.interfaces.js";
import { processarPerguntaStream } from "../services/rag.service.js";

/**
 * Controller do módulo de chat com Server-Sent Events (SSE).
 *
 * Responsável por:
 *   - Receber e validar a requisição HTTP
 *   - Configurar os headers SSE para streaming
 *   - Delegar o processamento ao serviço RAG (que faz o pipe dos tokens)
 *   - Tratar erros (incluindo queda do homelab a meio do stream)
 *
 * Decisão de projeto: SSE (Server-Sent Events) em vez de WebSocket porque:
 *   - É unidirecional (servidor → cliente), perfeito para streaming de respostas
 *   - Funciona sobre HTTP padrão, sem necessidade de upgrade de protocolo
 *   - Reconexão automática nativa do navegador
 *   - Mais simples de implementar e debugar
 */

/**
 * Processa uma pergunta enviada pelo aluno via streaming SSE.
 *
 * Endpoint: POST /api/chat
 * Body esperado: { "pergunta": "Qual é a carga horária do curso?" }
 *
 * Resposta: stream SSE com eventos:
 *   data: {"type":"fontes","fontes":["..."]}   → fontes dos documentos
 *   data: {"type":"token","content":"texto"}    → cada token da resposta
 *   data: [DONE]                                → sinaliza fim do stream
 */
export async function enviarPergunta(
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

    // Validação: tamanho mínimo para evitar consultas sem sentido
    const perguntaTrimmed = pergunta.trim();
    if (perguntaTrimmed.length < 3) {
      res.status(400).json({
        erro: "A pergunta deve ter pelo menos 3 caracteres.",
      });
      return;
    }

    // Validação: tamanho máximo para proteger o pipeline de textos muito longos
    if (perguntaTrimmed.length > 1000) {
      res.status(400).json({
        erro: "A pergunta deve ter no máximo 1000 caracteres.",
      });
      return;
    }

    // ── Configura headers SSE (Server-Sent Events) ──
    // Content-Type: text/event-stream indica ao navegador que é um stream SSE
    // Cache-Control: no-cache evita que proxies/browsers cacheem os eventos
    // Connection: keep-alive mantém a conexão TCP aberta durante o stream
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Desabilita buffering em proxies nginx
    });

    // Detecta desconexão do cliente (ex: fechar aba) para abortar o pipeline
    req.on("close", () => {
      console.log("🔌 [SSE] Cliente desconectou durante o stream");
    });

    // Delega o processamento ao serviço RAG com streaming
    await processarPerguntaStream(perguntaTrimmed, res);

    // Encerra a conexão SSE após o stream completo
    res.end();
  } catch (error) {
    console.error("[ChatController] Erro ao processar pergunta:", error);

    // Se os headers já foram enviados (stream iniciado), envia erro via SSE
    if (res.headersSent) {
      const mensagemErro =
        error instanceof Error && error.message.includes("Ollama")
          ? "O servidor de IA ficou inacessível durante a geração. Tente novamente."
          : "Ocorreu um erro durante a geração da resposta.";

      res.write(
        `data: ${JSON.stringify({ type: "erro", mensagem: mensagemErro })}\n\n`
      );
      res.end();
    } else {
      // Se os headers ainda não foram enviados, retorna JSON normal
      res.status(500).json({
        erro: "Ocorreu um erro interno ao processar sua pergunta. Tente novamente mais tarde.",
      });
    }
  }
}
