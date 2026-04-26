/**
 * Interfaces do módulo de ingestão de documentos (Embedding).
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
  /** Conteúdo textual do chunk */
  conteudo: string;
  /** Metadados associados (nome do arquivo, página, índice) */
  metadata: {
    filename: string;
    chunkIndex: number;
    totalChunks: number;
    /** Página aproximada (estimada pela posição no texto) */
    paginaAproximada?: number;
  };
}

/** Documento já gravado no banco (retornado na listagem) */
export interface DocumentoGravado {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
