import { pool } from "../config/database.js";
import { generateOllamaEmbedding } from "../config/ollama.js";

/**
 * Serviço de Feedback — ICL Dinâmico (In-Context Learning).
 *
 * Responsável por:
 *   - Persistir feedbacks (👍/👎) com embedding vetorial no PostgreSQL
 *   - Buscar exemplos positivos por similaridade (para injeção few-shot)
 *   - Contar feedbacks negativos acumulados por chunk (para penalização RRF)
 *
 * Tabela utilizada: chat_feedbacks (criada por migrate_feedbacks.sql)
 */

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/**
 * Threshold mínimo de similaridade de cosseno para considerar um exemplo
 * positivo como relevante para injeção few-shot.
 *
 * Valores recomendados:
 *   0.80 — mais permissivo (mais exemplos injetados, risco de ruído)
 *   0.85 — equilíbrio (padrão)
 *   0.90 — mais restritivo (menos exemplos, maior precisão)
 */
const FEW_SHOT_SIMILARITY_THRESHOLD = 0.85;

/**
 * Número máximo de exemplos positivos a retornar por busca few-shot.
 * Cada exemplo consome ~200-400 tokens da janela de contexto (num_ctx: 8192).
 */
const MAX_FEW_SHOT_EXAMPLES = 3;

/**
 * Fator de sensibilidade à penalização por feedback negativo.
 * Score_final = Score_RRF × 1 / (1 + PENALTY_BETA × N_negativos)
 *
 * β = 0.3 → penalização suave e progressiva
 */
export const PENALTY_BETA = 0.3;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Parâmetros para salvar um feedback no banco */
export interface SaveFeedbackParams {
  question: string;
  response: string;
  feedbackType: "positive" | "negative";
  chunkIds: number[];
  metadata?: Record<string, unknown>;
}

/** Exemplo positivo retornado pela busca few-shot */
export interface FewShotExample {
  question: string;
  response: string;
  similarity: number;
}

// ---------------------------------------------------------------------------
// Persistência de Feedback
// ---------------------------------------------------------------------------

/**
 * Persiste o feedback no banco de dados com o embedding vetorial da pergunta.
 *
 * Fluxo:
 *   1. Gera o embedding da pergunta via bge-m3 (Ollama)
 *   2. INSERT na tabela chat_feedbacks com vetor + chunk_ids + metadados
 *
 * Chamada de forma assíncrona (fire-and-forget) pelo controller de feedback.
 *
 * @param params - Dados do feedback a ser salvo
 */
export async function saveFeedback(params: SaveFeedbackParams): Promise<void> {
  const { question, response, feedbackType, chunkIds, metadata } = params;

  try {
    // 1. Gerar embedding da pergunta
    const embedding = await generateOllamaEmbedding(question);
    const vectorStr = `[${embedding.join(",")}]`;

    // 2. Inserir no banco
    await pool.query(
      `INSERT INTO chat_feedbacks
        (question, response, question_embedding, feedback_type, chunk_ids, metadata)
       VALUES ($1, $2, $3::vector, $4, $5, $6)`,
      [
        question,
        response,
        vectorStr,
        feedbackType,
        chunkIds,
        JSON.stringify(metadata || {}),
      ]
    );

    console.log(
      `💾 [Feedback] Salvo com sucesso: ${feedbackType === "positive" ? "👍" : "👎"} ` +
      `(${chunkIds.length} chunk(s), ${embedding.length}d embedding)`
    );
  } catch (error) {
    console.error(
      "❌ [Feedback] Erro ao salvar no banco:",
      error instanceof Error ? error.message : error
    );
    // Não propaga o erro — feedback é fire-and-forget
  }
}

// ---------------------------------------------------------------------------
// Busca de Exemplos Positivos (Few-Shot)
// ---------------------------------------------------------------------------

/**
 * Busca até N exemplos positivos mais similares à pergunta atual.
 *
 * Usa o índice HNSW da tabela chat_feedbacks para encontrar interações
 * anteriores avaliadas com 👍 que tenham alta similaridade de cosseno
 * com o embedding da pergunta atual.
 *
 * Retorna array vazio se nenhum exemplo superar o threshold.
 *
 * @param questionEmbedding - Vetor da pergunta atual (já gerado na Etapa 1 do pipeline)
 * @param threshold         - Similaridade mínima de cosseno (default: 0.85)
 * @param maxExamples       - Número máximo de exemplos a retornar (default: 3)
 * @returns Array de exemplos positivos ordenados por similaridade decrescente
 */
export async function getPositiveExamples(
  questionEmbedding: number[],
  threshold: number = FEW_SHOT_SIMILARITY_THRESHOLD,
  maxExamples: number = MAX_FEW_SHOT_EXAMPLES
): Promise<FewShotExample[]> {
  try {
    const vectorStr = `[${questionEmbedding.join(",")}]`;

    const result = await pool.query(
      `SELECT question, response,
              1 - (question_embedding <=> $1::vector) AS similarity
       FROM chat_feedbacks
       WHERE feedback_type = 'positive'
         AND 1 - (question_embedding <=> $1::vector) > $2
       ORDER BY question_embedding <=> $1::vector
       LIMIT $3`,
      [vectorStr, threshold, maxExamples]
    );

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows.map((row) => ({
      question: row.question,
      response: row.response,
      similarity: Number(row.similarity),
    }));
  } catch (error) {
    // Falha silenciosa: se a tabela não existir ou houver erro,
    // o pipeline continua sem exemplos few-shot
    console.warn(
      "⚠️  [ICL] Erro ao buscar exemplos positivos:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Contagem de Feedbacks Negativos por Chunk
// ---------------------------------------------------------------------------

/**
 * Retorna um Map<chunkId, contagemNegativos> para os chunks fornecidos.
 *
 * Usado pelo pipeline RRF para aplicar penalização matemática aos chunks
 * que acumularam feedbacks negativos:
 *   Score_final = Score_RRF × 1 / (1 + β × N_negativos)
 *
 * @param chunkIds - Array de IDs dos chunks retornados pela busca híbrida
 * @returns Map onde a chave é o chunk_id e o valor é o número de feedbacks negativos
 */
export async function countNegativesByChunk(
  chunkIds: number[]
): Promise<Map<number, number>> {
  const negatives = new Map<number, number>();

  // Se não há chunk_ids, retorna mapa vazio
  if (!chunkIds || chunkIds.length === 0) {
    return negatives;
  }

  try {
    const result = await pool.query(
      `SELECT unnest(chunk_ids) AS chunk_id, COUNT(*) AS neg_count
       FROM chat_feedbacks
       WHERE feedback_type = 'negative'
         AND chunk_ids && $1::integer[]
       GROUP BY chunk_id`,
      [chunkIds]
    );

    for (const row of result.rows) {
      negatives.set(Number(row.chunk_id), Number(row.neg_count));
    }
  } catch (error) {
    // Falha silenciosa: se a tabela não existir, retorna mapa vazio
    console.warn(
      "⚠️  [ICL] Erro ao contar negativos por chunk:",
      error instanceof Error ? error.message : error
    );
  }

  return negatives;
}
