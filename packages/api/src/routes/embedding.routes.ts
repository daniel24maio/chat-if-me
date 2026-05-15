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
 *   - fileFilter: validação dupla (MIME type + extensão)
 */

/** Extensões de arquivo aceitas */
const EXTENSOES_ACEITAS = /\.(pdf|docx?|xlsx?|csv|txt|jpe?g|png)$/i;

/** MIME types aceitos (validação dupla com extensão) */
const MIMES_ACEITOS = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
]);

/** Configuração do Multer para receber arquivos em memória */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (_req, file, cb) => {
    const mimeOk = MIMES_ACEITOS.has(file.mimetype);
    const extOk = EXTENSOES_ACEITAS.test(file.originalname);

    if (mimeOk && extOk) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype} (${file.originalname})`));
    }
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
