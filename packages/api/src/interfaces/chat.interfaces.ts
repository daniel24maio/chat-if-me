/**
 * Interfaces de domínio do módulo de chat.
 * Centralizar as tipagens facilita a manutenção e a documentação do TCC.
 */

/** Corpo da requisição enviada pelo frontend ao endpoint /api/chat */
export interface ChatRequestBody {
  /** Pergunta do aluno sobre regulamentos ou PPC */
  pergunta: string;
}

/** Resposta devolvida pela API ao frontend */
export interface ChatResponseBody {
  /** Resposta gerada pelo pipeline RAG */
  resposta: string;
  /** Trechos dos documentos recuperados que fundamentaram a resposta */
  fontes: string[];
}

/**
 * Representa um trecho de documento recuperado pela busca semântica.
 * Será populado quando integrarmos o pgvector.
 */
export interface DocumentoRecuperado {
  /** Conteúdo textual do trecho */
  conteudo: string;
  /** Nome ou identificador do documento de origem (ex.: "PPC_SI_2023.pdf") */
  origem: string;
  /** Pontuação de similaridade retornada pelo pgvector (0 a 1) */
  similaridade: number;
}
