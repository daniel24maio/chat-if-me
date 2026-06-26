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
export type ProcessingStatus =
  | "uploading"
  | "extracting_text"
  | "splitting_chunks"
  | "generating_embeddings"
  | "saving_db"
  | "completed"
  | "error";

/** Resposta do endpoint de upload */
export interface UploadResponse {
  /** Mensagem descritiva do resultado */
  message: string;
  /** Nome do arquivo processado */
  file: string;
  /** Número total de chunks gerados */
  totalChunks: number;
  /** Número de chunks gravados com sucesso no banco */
  savedChunks: number;
}

/** Dados de um chunk individual antes da vetorização */
export interface ChunkData {
  /** Conteúdo textual do chunk (já com prefixo de contexto) */
  content: string;
  /** Metadados associados (gravados como JSONB no PostgreSQL) */
  metadata: {
    /** Nome do arquivo original */
    filename: string;
    /** Índice sequencial do chunk dentro do documento */
    chunkIndex: number;
    /** Total de chunks gerados for this document */
    totalChunks: number;
    /** Nome legível do documento (sem extensão, ex: "Regulamento de TCC") */
    documentName: string;
    /** Estratégia de chunking utilizada */
    chunkingType: "juridical" | "table" | "general";
    /** Seção/capítulo do documento onde este chunk se encontra */
    sectionContext: string;
  };
}

/** Documento já gravado no banco (retornado na listagem) */
export interface SavedDocument {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
