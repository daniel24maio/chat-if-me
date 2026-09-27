import { pool } from "../config/database.js";

/**
 * Interface para os parâmetros de registro de uma interação no banco.
 */
export interface LogInteractionParams {
  sessionId: string;
  mode: "rag" | "agent" | "agent_beta";
  question: string;
  contextualizedQuestion?: string;
  intent?: string;
  toolCalls?: Array<{ name: string; arguments?: Record<string, unknown> }>;
  sources?: string[];
  chunkIds?: number[];
  response: string;
  timings?: {
    rewrite_ms?: number;
    embedding_ms?: number;
    retrieval_ms?: number;
    generation_ms?: number;
    total_ms?: number;
  };
  totalDurationMs?: number;
  feedback?: "up" | "down";
}

/**
 * Filtros comuns para as consultas de analítica.
 */
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  mode?: string;
  intent?: string;
  feedback?: string;
  search?: string;
}

/**
 * Registra uma interação no banco de dados de forma assíncrona (fire-and-forget).
 * Não bloqueia o envio da resposta SSE ao discente.
 */
export async function logInteraction(params: LogInteractionParams): Promise<void> {
  const {
    sessionId,
    mode,
    question,
    contextualizedQuestion,
    intent,
    toolCalls = [],
    sources = [],
    chunkIds = [],
    response,
    timings = {},
    totalDurationMs,
    feedback,
  } = params;

  try {
    await pool.query(
      `INSERT INTO chat_interactions
        (session_id, mode, question, contextualized_question, intent, tool_calls, sources, chunk_ids, response, timings, total_duration_ms, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        sessionId,
        mode,
        question,
        contextualizedQuestion || null,
        intent || "OUTRAS",
        JSON.stringify(toolCalls),
        JSON.stringify(sources),
        chunkIds,
        response,
        JSON.stringify(timings),
        totalDurationMs || timings.total_ms || 0,
        feedback || null,
      ]
    );

    console.log(
      `📊 [Analytics] Interação registrada: [${mode.toUpperCase()}] "${question.substring(0, 40)}..." ` +
      `(${totalDurationMs || timings.total_ms || 0}ms)`
    );
  } catch (error) {
    console.error("❌ [Analytics] Erro ao persistir interação no banco:", error);
  }
}

/**
 * Atualiza o feedback da última interação correspondente à sessão.
 */
export async function updateInteractionFeedback(
  sessionId: string,
  feedback: "up" | "down"
): Promise<void> {
  try {
    const result = await pool.query(
      `UPDATE chat_interactions
       SET feedback = $1
       WHERE id = (
         SELECT id FROM chat_interactions
         WHERE session_id = $2
         ORDER BY created_at DESC
         LIMIT 1
       )`,
      [feedback, sessionId]
    );

    if ((result.rowCount ?? 0) > 0) {
      console.log(`📊 [Analytics] Voto '${feedback}' registrado na tabela de interações para a sessão ${sessionId.substring(0, 8)}...`);
    }
  } catch (error) {
    console.error("❌ [Analytics] Erro ao atualizar feedback da interação:", error);
  }
}

/**
 * Retorna as métricas agregadas (KPIs) para o Dashboard.
 */
export async function getAnalyticsOverview(filters: AnalyticsFilters) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.startDate) {
    conditions.push(`created_at >= $${paramIdx++}::timestamp`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`created_at <= ($${paramIdx++}::timestamp + interval '1 day')`);
    params.push(filters.endDate);
  }

  if (filters.mode && filters.mode !== "all") {
    conditions.push(`mode = $${paramIdx++}`);
    params.push(filters.mode);
  }

  const whereClause = conditions.join(" AND ");

  // 1. Métricas Globais (Totais, Latência Média, Feedbacks)
  const globalQuery = await pool.query(
    `SELECT
       COUNT(*) AS total_interactions,
       COUNT(CASE WHEN mode = 'rag' THEN 1 END) AS count_rag,
       COUNT(CASE WHEN mode = 'agent' THEN 1 END) AS count_agent,
       COUNT(CASE WHEN mode = 'agent_beta' THEN 1 END) AS count_agent_beta,
       COALESCE(AVG(total_duration_ms), 0) AS avg_duration_ms,
       COALESCE(AVG(CASE WHEN mode = 'rag' THEN total_duration_ms END), 0) AS avg_duration_rag,
       COALESCE(AVG(CASE WHEN mode = 'agent' THEN total_duration_ms END), 0) AS avg_duration_agent,
       COALESCE(AVG(CASE WHEN mode = 'agent_beta' THEN total_duration_ms END), 0) AS avg_duration_beta,
       COUNT(CASE WHEN feedback = 'up' THEN 1 END) AS feedback_up,
       COUNT(CASE WHEN feedback = 'down' THEN 1 END) AS feedback_down,
       COUNT(CASE WHEN feedback IS NULL THEN 1 END) AS feedback_none
     FROM chat_interactions
     WHERE ${whereClause}`,
    params
  );

  const row = globalQuery.rows[0];
  const total = Number(row.total_interactions) || 0;
  const up = Number(row.feedback_up) || 0;
  const down = Number(row.feedback_down) || 0;
  const totalRated = up + down;
  const satisfactionRate = totalRated > 0 ? (up / totalRated) * 100 : 0;

  // 2. Distribuição por Intenção
  const intentsQuery = await pool.query(
    `SELECT intent, COUNT(*) as count
     FROM chat_interactions
     WHERE ${whereClause} AND intent IS NOT NULL
     GROUP BY intent
     ORDER BY count DESC
     LIMIT 10`,
    params
  );

  // 3. Documentos mais citados (Top Sources)
  const sourcesQuery = await pool.query(
    `SELECT source, COUNT(*) as count
     FROM (
       SELECT jsonb_array_elements_text(sources) AS source
       FROM chat_interactions
       WHERE ${whereClause}
     ) sub
     WHERE source <> 'documento desconhecido'
     GROUP BY source
     ORDER BY count DESC
     LIMIT 8`,
    params
  );

  return {
    totalInteractions: total,
    byMode: {
      rag: Number(row.count_rag) || 0,
      agent: Number(row.count_agent) || 0,
      agent_beta: Number(row.count_agent_beta) || 0,
    },
    latency: {
      overallAvgMs: Math.round(Number(row.avg_duration_ms)),
      ragAvgMs: Math.round(Number(row.avg_duration_rag)),
      agentAvgMs: Math.round(Number(row.avg_duration_agent)),
      betaAvgMs: Math.round(Number(row.avg_duration_beta)),
    },
    feedback: {
      up,
      down,
      unrated: Number(row.feedback_none) || 0,
      satisfactionRate: Number(satisfactionRate.toFixed(1)),
    },
    intentsDistribution: intentsQuery.rows.map((r) => ({
      intent: r.intent,
      count: Number(r.count),
    })),
    topSources: sourcesQuery.rows.map((r) => ({
      source: r.source,
      count: Number(r.count),
    })),
  };
}

/**
 * Retorna o histórico detalhado paginado para a tabela do Dashboard.
 */
export async function getAnalyticsHistory(
  filters: AnalyticsFilters,
  page: number = 1,
  limit: number = 15
) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.startDate) {
    conditions.push(`created_at >= $${paramIdx++}::timestamp`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`created_at <= ($${paramIdx++}::timestamp + interval '1 day')`);
    params.push(filters.endDate);
  }

  if (filters.mode && filters.mode !== "all") {
    conditions.push(`mode = $${paramIdx++}`);
    params.push(filters.mode);
  }

  if (filters.intent && filters.intent !== "all") {
    conditions.push(`intent = $${paramIdx++}`);
    params.push(filters.intent);
  }

  if (filters.feedback && filters.feedback !== "all") {
    if (filters.feedback === "none") {
      conditions.push(`feedback IS NULL`);
    } else {
      conditions.push(`feedback = $${paramIdx++}`);
      params.push(filters.feedback);
    }
  }

  if (filters.search && filters.search.trim()) {
    conditions.push(`(question ILIKE $${paramIdx} OR response ILIKE $${paramIdx})`);
    params.push(`%${filters.search.trim()}%`);
    paramIdx++;
  }

  const whereClause = conditions.join(" AND ");

  // Total de registros
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM chat_interactions WHERE ${whereClause}`,
    params
  );
  const total = Number(countResult.rows[0]?.total) || 0;

  // Consulta paginada
  const offset = (page - 1) * limit;
  const listParams = [...params, limit, offset];
  const listResult = await pool.query(
    `SELECT
       id,
       session_id,
       mode,
       question,
       intent,
       sources,
       tool_calls,
       response,
       timings,
       total_duration_ms,
       feedback,
       created_at
     FROM chat_interactions
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    listParams
  );

  return {
    interactions: listResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retorna os detalhes completos de uma única interação.
 */
export async function getInteractionById(id: number) {
  const result = await pool.query(
    `SELECT * FROM chat_interactions WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Exporta o histórico filtrado em formato CSV para análise científica e planilhas.
 */
export async function exportAnalyticsCSV(filters: AnalyticsFilters): Promise<string> {
  const { interactions } = await getAnalyticsHistory(filters, 1, 10000);

  const header = [
    "ID",
    "Data/Hora",
    "Modo",
    "Intencao",
    "Pergunta",
    "Latencia_Total_ms",
    "Feedback",
    "Fontes",
    "Resposta",
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = interactions.map((item) => [
    item.id,
    new Date(item.created_at).toLocaleString("pt-BR"),
    item.mode,
    item.intent,
    escapeCSV(item.question),
    item.total_duration_ms,
    item.feedback || "sem_avaliacao",
    escapeCSV((item.sources || []).join("; ")),
    escapeCSV(item.response),
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
