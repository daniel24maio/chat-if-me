import type { Request, Response } from "express";
import {
  processDocument,
  listProcessedDocuments,
  removeDocument,
} from "../services/embedding.service.js";

/**
 * Controller do módulo de ingestão (Embedding).
 *
 * Responsável por:
 *   - Validar o arquivo enviado (tipo, presença)
 *   - Delegar o processamento ao service
 *   - Retornar status ao cliente
 */

/** Tipos de arquivo aceitos para upload */
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
  "text/plain", // .txt
  "text/markdown", // .md
  "image/jpeg", // .jpg, .jpeg
  "image/png", // .png
];

/**
 * Processa o upload de um documento para ingestão.
 *
 * Endpoint: POST /api/embedding/upload
 * Tipo: multipart/form-data com campo "file"
 */
export async function uploadDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const file = req.file;

    // Validação: arquivo obrigatório
    if (!file) {
      res.status(400).json({
        error: "Nenhum arquivo foi enviado. Envie um arquivo no campo 'file'.",
      });
      return;
    }

    // Validação: tipo de arquivo
    if (!ACCEPTED_TYPES.includes(file.mimetype)) {
      res.status(400).json({
        error: `Tipo de arquivo não suportado: ${file.mimetype}. Aceitos: PDF, Word, Excel, CSV, TXT, MD, Imagens.`,
      });
      return;
    }

    // Validação: tamanho máximo (20 MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      res.status(400).json({
        error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 20 MB.`,
      });
      return;
    }

    console.log(
      `📤 [Upload] Recebido: "${file.originalname}" (${(file.size / 1024).toFixed(0)} KB)`
    );

    // Delega o processamento ao serviço de embedding
    const result = await processDocument(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("[EmbeddingController] Erro no upload:", error);

    // Detecta erros específicos do Ollama
    const errorMessage =
      error instanceof Error && error.message.includes("Ollama")
        ? "O servidor Ollama está offline. Verifique se está rodando e tente novamente."
        : "Erro interno ao processar o documento. Tente novamente.";

    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Lista os documentos já processados.
 *
 * Endpoint: GET /api/embedding/documentos
 */
export async function listDocuments(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const documents = await listProcessedDocuments();
    res.status(200).json({ documents });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao listar documentos:", error);
    res.status(500).json({ error: "Erro ao listar documentos processados." });
  }
}

/**
 * Remove um documento processado (exclui todos os chunks associados).
 *
 * Endpoint: DELETE /api/embedding/documentos/:filename
 */
export async function deleteDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { filename } = req.params;

    if (!filename) {
      res.status(400).json({ error: "Nome do arquivo não fornecido." });
      return;
    }

    const removed = await removeDocument(filename);

    if (removed === 0) {
      res.status(404).json({ error: "Documento não encontrado no banco." });
      return;
    }

    res.status(200).json({
      message: `Documento '${filename}' removido com sucesso.`,
      removedChunks: removed,
    });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao deletar documento:", error);
    res.status(500).json({ error: "Erro ao excluir o documento." });
  }
}
