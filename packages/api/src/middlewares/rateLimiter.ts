import rateLimit from "express-rate-limit";

/**
 * Middlewares de Rate Limiting para proteger a API contra abuso.
 *
 * Limites diferenciados por tipo de rota:
 *   - Chat/Agent: 20 req/min por IP (streaming consome mais recursos)
 *   - Upload:      5 req/min por IP (ingestão é CPU/GPU-intensiva)
 */

/** Rate limiter para rotas de chat e agente — 20 req/min por IP */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Muitas requisições. Aguarde um momento e tente novamente.",
  },
});

/** Rate limiter para upload de documentos — 5 req/min por IP */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Limite de uploads atingido. Tente novamente em 1 minuto.",
  },
});
