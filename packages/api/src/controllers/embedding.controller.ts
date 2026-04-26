import type { Request, Response } from "express";
import {
  processarDocumento,
  listarDocumentosProcessados,
  removerDocumento,
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
const TIPOS_ACEITOS = ["application/pdf"];

/**
 * Processa o upload de um documento para ingestão.
 *
 * Endpoint: POST /api/embedding/upload
 * Tipo: multipart/form-data com campo "arquivo"
 */
export async function uploadDocumento(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const arquivo = req.file;

    // Validação: arquivo obrigatório
    if (!arquivo) {
      res.status(400).json({
        erro: "Nenhum arquivo foi enviado. Envie um PDF no campo 'arquivo'.",
      });
      return;
    }

    // Validação: tipo de arquivo
    if (!TIPOS_ACEITOS.includes(arquivo.mimetype)) {
      res.status(400).json({
        erro: `Tipo de arquivo não suportado: ${arquivo.mimetype}. Aceito: PDF.`,
      });
      return;
    }

    // Validação: tamanho máximo (20 MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (arquivo.size > MAX_SIZE) {
      res.status(400).json({
        erro: `Arquivo muito grande (${(arquivo.size / 1024 / 1024).toFixed(1)} MB). Máximo: 20 MB.`,
      });
      return;
    }

    console.log(
      `📤 [Upload] Recebido: "${arquivo.originalname}" (${(arquivo.size / 1024).toFixed(0)} KB)`
    );

    // Delega o processamento ao serviço de embedding
    const resultado = await processarDocumento(
      arquivo.buffer,
      arquivo.originalname
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("[EmbeddingController] Erro no upload:", error);

    // Detecta erros específicos do Ollama
    const mensagemErro =
      error instanceof Error && error.message.includes("Ollama")
        ? "O servidor Ollama está offline. Verifique se está rodando e tente novamente."
        : "Erro interno ao processar o documento. Tente novamente.";

    res.status(500).json({ erro: mensagemErro });
  }
}

/**
 * Lista os documentos já processados.
 *
 * Endpoint: GET /api/embedding/documentos
 */
export async function listarDocumentos(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const documentos = await listarDocumentosProcessados();
    res.status(200).json({ documentos });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao listar documentos:", error);
    res.status(500).json({ erro: "Erro ao listar documentos processados." });
  }
}

/**
 * Remove um documento processado (exclui todos os chunks associados).
 *
 * Endpoint: DELETE /api/embedding/documentos/:filename
 */
export async function deletarDocumento(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { filename } = req.params;

    if (!filename) {
      res.status(400).json({ erro: "Nome do arquivo não fornecido." });
      return;
    }

    const removidos = await removerDocumento(filename);

    if (removidos === 0) {
      res.status(404).json({ erro: "Documento não encontrado no banco." });
      return;
    }

    res.status(200).json({
      mensagem: `Documento '${filename}' removido com sucesso.`,
      chunksRemovidos: removidos,
    });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao deletar documento:", error);
    res.status(500).json({ erro: "Erro ao excluir o documento." });
  }
}
