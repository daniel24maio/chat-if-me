import type { Request, Response } from "express";
import {
  getAnalyticsOverview,
  getAnalyticsHistory,
  getInteractionById,
  exportAnalyticsCSV,
  type AnalyticsFilters,
} from "../services/analytics.service.js";

/**
 * Controller de Estatísticas e Métricas de Uso do Assistente.
 */

export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const filters: AnalyticsFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      mode: req.query.mode as string,
    };

    const overview = await getAnalyticsOverview(filters);
    res.status(200).json(overview);
  } catch (error) {
    console.error("[StatsController] Erro ao carregar overview:", error);
    res.status(500).json({ error: "Erro ao calcular métricas de estatísticas." });
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const filters: AnalyticsFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      mode: req.query.mode as string,
      intent: req.query.intent as string,
      feedback: req.query.feedback as string,
      search: req.query.search as string,
    };

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));

    const history = await getAnalyticsHistory(filters, page, limit);
    res.status(200).json(history);
  } catch (error) {
    console.error("[StatsController] Erro ao carregar histórico:", error);
    res.status(500).json({ error: "Erro ao listar histórico de interações." });
  }
}

export async function getDetails(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    const interaction = await getInteractionById(id);
    if (!interaction) {
      res.status(404).json({ error: "Interação não encontrada." });
      return;
    }

    res.status(200).json(interaction);
  } catch (error) {
    console.error("[StatsController] Erro ao obter detalhes da interação:", error);
    res.status(500).json({ error: "Erro interno ao buscar interação." });
  }
}

export async function exportCSV(req: Request, res: Response): Promise<void> {
  try {
    const filters: AnalyticsFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      mode: req.query.mode as string,
      intent: req.query.intent as string,
      feedback: req.query.feedback as string,
      search: req.query.search as string,
    };

    const csvData = await exportAnalyticsCSV(filters);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=chatifme_interacoes_${new Date().toISOString().slice(0, 10)}.csv`
    );

    // BOM para o Excel em português abrir com acentos corretos
    res.status(200).send("\uFEFF" + csvData);
  } catch (error) {
    console.error("[StatsController] Erro ao exportar CSV:", error);
    res.status(500).json({ error: "Erro ao gerar arquivo CSV." });
  }
}
