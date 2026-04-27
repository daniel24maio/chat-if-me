import { Router } from "express";
import multer from "multer";
import {
  uploadDocumento,
  listarDocumentos,
  deletarDocumento,
} from "../controllers/embedding.controller.js";

/**
 * Rotas do módulo de ingestão de documentos (Embedding).
 *
 * Configuração do Multer:
 *   - storage: memória (buffer) — não persiste arquivo em disco
 *   - limits: 20 MB por arquivo
 *   - fileFilter: validação no controller (PDF, Word, Excel, TXT, Imagens)
 */

/** Configuração do Multer para receber arquivos em memória */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

const embeddingRouter = Router();

/**
 * POST /api/embedding/upload
 * Recebe um arquivo suportado e processa: extrai texto → chunking → embedding → gravação.
 *
 * Content-Type: multipart/form-data
 * Campo: "arquivo" (file)
 */
embeddingRouter.post("/upload", upload.single("arquivo"), uploadDocumento);

/**
 * GET /api/embedding/documentos
 * Lista os documentos já processados com contagem de chunks.
 */
embeddingRouter.get("/documentos", listarDocumentos);

/**
 * DELETE /api/embedding/documentos/:filename
 * Remove um documento e todos os seus chunks.
 */
embeddingRouter.delete("/documentos/:filename", deletarDocumento);

export { embeddingRouter };
