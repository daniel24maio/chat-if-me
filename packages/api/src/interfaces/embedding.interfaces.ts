/**
 * Interfaces do módulo de ingestão de documentos (Embedding) — v4.
 *
 * Alterações em relação à v3:
 *   - ChunkData.metadata agora inclui campos de contexto global:
 *     • nomeDocumento: nome legível do documento (sem extensão)
 *     • tipoChunking: estratégia usada (juridico | tabela | geral)
 *     • contextoSecao: seção/capítulo onde o chunk se encontra
 *   - Esses campos são usados para injetar um prefixo de contexto
 *     no texto antes da vetorização, evitando OOC (Out of Context).
 */

/** Status de processamento de um documento enviado */
export type StatusProcessamento =
  | "enviando"
  | "extraindo_texto"
  | "dividindo_chunks"
  | "gerando_embeddings"
  | "gravando_banco"
  | "concluido"
  | "erro";

/** Resposta do endpoint de upload */
export interface UploadResponse {
  /** Mensagem descritiva do resultado */
  mensagem: string;
  /** Nome do arquivo processado */
  arquivo: string;
  /** Número total de chunks gerados */
  totalChunks: number;
  /** Número de chunks gravados com sucesso no banco */
  chunksGravados: number;
}

/** Dados de um chunk individual antes da vetorização */
export interface ChunkData {
  /** Conteúdo textual do chunk (já com prefixo de contexto) */
  conteudo: string;
  /** Metadados associados (gravados como JSONB no PostgreSQL) */
  metadata: {
    /** Nome do arquivo original */
    filename: string;
    /** Índice sequencial do chunk dentro do documento */
    chunkIndex: number;
    /** Total de chunks gerados para este documento */
    totalChunks: number;
    /** Nome legível do documento (sem extensão, ex: "Regulamento de TCC") */
    nomeDocumento: string;
    /** Estratégia de chunking utilizada */
    tipoChunking: "juridico" | "tabela" | "geral";
    /** Seção/capítulo do documento onde este chunk se encontra */
    contextoSecao: string;
  };
}

/** Documento já gravado no banco (retornado na listagem) */
export interface DocumentoGravado {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
