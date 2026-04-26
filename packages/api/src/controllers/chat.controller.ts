import type { Request, Response } from "express";
import type { ChatRequestBody, ChatResponseBody } from "../interfaces/chat.interfaces.js";
import { processarPergunta } from "../services/rag.service.js";

/**
 * Controller do módulo de chat.
 *
 * Responsável por:
 *   - Receber e validar a requisição HTTP
 *   - Delegar o processamento ao serviço RAG
 *   - Formatar e retornar a resposta ao cliente
 *
 * Decisão de projeto: separar controller e service facilita testes unitários
 * e permite trocar a implementação do RAG sem alterar a camada HTTP.
 */

/**
 * Processa uma pergunta enviada pelo aluno.
 *
 * Endpoint: POST /api/chat
 * Body esperado: { "pergunta": "Qual é a carga horária do curso?" }
 */
export async function enviarPergunta(
  req: Request<object, ChatResponseBody, ChatRequestBody>,
  res: Response<ChatResponseBody | { erro: string }>
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

    // Delega o processamento ao serviço RAG
    const resultado = await processarPergunta(perguntaTrimmed);

    // Retorna a resposta no formato padronizado
    res.status(200).json({
      resposta: resultado.resposta,
      fontes: resultado.fontes,
    });
  } catch (error) {
    // Log do erro real no servidor (não expor detalhes ao cliente)
    console.error("[ChatController] Erro ao processar pergunta:", error);

    res.status(500).json({
      erro: "Ocorreu um erro interno ao processar sua pergunta. Tente novamente mais tarde.",
    });
  }
}
