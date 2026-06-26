-- ==========================================================================
-- Migração: Tabela de Feedbacks com Vetor para ICL Dinâmico (Few-Shot)
--
-- Esta migração é IDEMPOTENTE: segura para rodar múltiplas vezes.
-- Executar no banco existente:
--   psql -U chatifme -d chatifme -f migrate_feedbacks.sql
--
-- Estrutura:
--   - question / response: interação avaliada pelo usuário
--   - question_embedding: vetor bge-m3 (1024d) para busca por similaridade
--   - feedback_type: 'positive' (👍) ou 'negative' (👎)
--   - chunk_ids: array de IDs da tabela documents usados naquela resposta
-- ==========================================================================

CREATE TABLE IF NOT EXISTS chat_feedbacks (
  -- Identificador único auto-incrementável
  id SERIAL PRIMARY KEY,

  -- Pergunta original do usuário (para exibição no few-shot)
  question TEXT NOT NULL,

  -- Resposta gerada pela IA (para injeção como exemplo)
  response TEXT NOT NULL,

  -- Vetor da PERGUNTA (bge-m3, 1024d) — usado para busca por similaridade
  question_embedding vector(1024) NOT NULL,

  -- Tipo de feedback: 'positive' (👍) ou 'negative' (👎)
  feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('positive', 'negative')),

  -- Array dos IDs de chunks (documents.id) que geraram esta resposta
  chunk_ids INTEGER[] NOT NULL DEFAULT '{}',

  -- Metadados opcionais (sessionId, messageId, pipeline usado, etc.)
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamp de criação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice HNSW para busca vetorial de exemplos similares (few-shot lookup)
-- ef_construction=100 é suficiente para tabelas < 10k registros
CREATE INDEX IF NOT EXISTS idx_feedbacks_question_embedding
  ON chat_feedbacks
  USING hnsw (question_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 100);

-- Índice parcial: acelera buscas restritas a feedbacks positivos
CREATE INDEX IF NOT EXISTS idx_feedbacks_positive
  ON chat_feedbacks (feedback_type)
  WHERE feedback_type = 'positive';

-- Índice GIN nos chunk_ids para contagem eficiente de negativos por chunk
CREATE INDEX IF NOT EXISTS idx_feedbacks_chunk_ids
  ON chat_feedbacks USING GIN (chunk_ids);

DO $$
BEGIN
  RAISE NOTICE 'Migração de chat_feedbacks (ICL Dinâmico) concluída!';
END
$$;
