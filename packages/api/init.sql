-- ==========================================================================
-- Inicialização do banco de dados para o Chat Assistente Virtual IFMG
-- Habilita pgvector, FTS com unaccent, tabelas de documentos e feedbacks.
--
-- Executar manualmente no PostgreSQL:
--   psql -U usuario -d chatifme -f init.sql
-- ==========================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- Full-Text Search — Configuração para português sem acentos
-- Combina unaccent (remove acentos) + portuguese_stem (stemming PT-BR)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'portuguese_unaccent'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION public.portuguese_unaccent (COPY = pg_catalog.portuguese);
    ALTER TEXT SEARCH CONFIGURATION public.portuguese_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, portuguese_stem;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Tabela principal de chunks de documentos vetorizados
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  embedding vector(1024) NOT NULL,
  content_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese_unaccent', content)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices da tabela documents
CREATE INDEX IF NOT EXISTS idx_documents_embedding
  ON documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);

CREATE INDEX IF NOT EXISTS idx_documents_fts
  ON documents USING GIN (content_tsv);

CREATE INDEX IF NOT EXISTS idx_documents_metadata
  ON documents USING gin (metadata);

-- ---------------------------------------------------------------------------
-- Tabela de Feedbacks e ICL Dinâmico (Few-Shot / Penalização RRF)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS chat_feedbacks (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  question_embedding vector(1024) NOT NULL,
  feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  chunk_ids INTEGER[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices da tabela chat_feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_question_embedding
  ON chat_feedbacks
  USING hnsw (question_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 100);

CREATE INDEX IF NOT EXISTS idx_feedbacks_positive
  ON chat_feedbacks (feedback_type)
  WHERE feedback_type = 'positive';

CREATE INDEX IF NOT EXISTS idx_feedbacks_chunk_ids
  ON chat_feedbacks USING GIN (chunk_ids);
