import { Router } from "express";
import {
  getOverview,
  getHistory,
  getDetails,
  exportCSV,
} from "../controllers/stats.controller.js";

/**
 * Rotas de Estatísticas e Métricas (/api/stats).
 */
const statsRouter = Router();

statsRouter.get("/overview", getOverview);
statsRouter.get("/history", getHistory);
statsRouter.get("/history/:id", getDetails);
statsRouter.get("/export", exportCSV);

export { statsRouter };
