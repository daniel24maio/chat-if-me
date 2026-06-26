/**
 * Interfaces de domínio do módulo de chat.
 * Centralizar as tipagens facilita a manutenção e a documentação do TCC.
 */

/** Corpo da requisição enviada pelo frontend ao endpoint /api/chat */
export interface ChatRequestBody {
  /** Pergunta do aluno sobre regulamentos ou PPC */
  question: string;
  /** Identificador da sessão (UUID gerado pelo frontend) para memória conversacional */
  sessionId?: string;
}

/** Resposta devolvida pela API ao frontend */
export interface ChatResponseBody {
  /** Resposta gerada pelo pipeline RAG */
  response: string;
  /** Trechos dos documentos recuperados que fundamentaram a resposta */
  sources: string[];
}

/**
 * Representa um trecho de documento recuperado pela busca semântica.
 * Será populado quando integrarmos o pgvector.
 */
export interface RetrievedDocument {
  /** ID do chunk no banco de dados (documents.id) — usado para rastrear feedbacks */
  id: number;
  /** Conteúdo textual do trecho */
  content: string;
  /** Nome ou identificador do documento de origem (ex.: "PPC_SI_2023.pdf") */
  source: string;
  /** Pontuação de similaridade retornada pelo pgvector (0 a 1) */
  similarity: number;
}
