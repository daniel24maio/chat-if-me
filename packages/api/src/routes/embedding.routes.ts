import { Router } from "express";
import multer from "multer";
import {
  uploadDocument,
  listDocuments,
  deleteDocument,
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
const ACCEPTED_EXTENSIONS = /\.(pdf|docx?|xlsx?|csv|txt|md|jpe?g|png)$/i;

/** MIME types aceitos (validação dupla com extensão) */
const ACCEPTED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "text/markdown",
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
    const mimeOk = ACCEPTED_MIMES.has(file.mimetype);
    const extOk = ACCEPTED_EXTENSIONS.test(file.originalname);

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
 * Campo: "file" (file)
 */
embeddingRouter.post("/upload", upload.single("file"), uploadDocument);

/**
 * GET /api/embedding/documentos
 * Lista os documentos já processados com contagem de chunks.
 */
embeddingRouter.get("/documentos", listDocuments);

/**
 * DELETE /api/embedding/documentos/:filename
 * Remove um documento e todos os seus chunks.
 */
embeddingRouter.delete("/documentos/:filename", deleteDocument);

export { embeddingRouter };
