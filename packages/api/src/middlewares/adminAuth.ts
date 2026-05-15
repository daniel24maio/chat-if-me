import type { Request, Response, NextFunction } from "express";

/**
 * Middleware de autenticação para rotas administrativas.
 *
 * Protege endpoints sensíveis (ex: /api/embedding) exigindo uma chave
 * de API no header `X-API-Key`. A chave é configurada via variável de
 * ambiente ADMIN_API_KEY.
 *
 * Comportamento:
 *   - Se ADMIN_API_KEY não estiver definida → bypass (modo dev)
 *   - Se definida → exige header X-API-Key com valor correspondente
 *   - Rotas GET (listagem) são liberadas para o frontend consultar
 */
export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Libera GETs (listagem de documentos) — protege apenas mutações
  if (req.method === "GET") {
    next();
    return;
  }

  const apiKey = process.env.ADMIN_API_KEY;

  // Se não configurada, libera (modo desenvolvimento)
  if (!apiKey) {
    next();
    return;
  }

  const provided = req.headers["x-api-key"] as string | undefined;

  if (!provided || provided !== apiKey) {
    res.status(401).json({
      erro: "Acesso não autorizado. Chave de API inválida ou ausente.",
    });
    return;
  }

  next();
}
