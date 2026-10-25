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

CREATE INDEX IF NOT EXISTS idx_feedbacks_chunk_ids
  ON chat_feedbacks USING GIN (chunk_ids);

-- ---------------------------------------------------------------------------
-- Tabela de Participantes Anônimos da Pesquisa (LGPD Compliant)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS chat_participants (
  participant_id UUID PRIMARY KEY,
  profile_type VARCHAR(30) NOT NULL CHECK (profile_type IN ('aluno_graduacao', 'aluno_tecnico', 'docente', 'tae')),
  course VARCHAR(50),
  course_phase VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_profile_type ON chat_participants (profile_type);
CREATE INDEX IF NOT EXISTS idx_participants_course ON chat_participants (course);

-- ---------------------------------------------------------------------------
-- Tabela de Interações e Métricas de Execução
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS chat_interactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  participant_id UUID REFERENCES chat_participants(participant_id) ON DELETE SET NULL,
  mode VARCHAR(30) NOT NULL,
  question TEXT NOT NULL,
  contextualized_question TEXT,
  intent VARCHAR(50),
  tool_calls JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  chunk_ids INTEGER[] DEFAULT '{}',
  response TEXT NOT NULL,
  timings JSONB DEFAULT '{}',
  total_duration_ms INTEGER,
  feedback VARCHAR(10),
  ttft_ms INTEGER,
  queue_wait_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON chat_interactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_mode ON chat_interactions (mode);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON chat_interactions (session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_participant ON chat_interactions (participant_id);
CREATE INDEX IF NOT EXISTS idx_interactions_intent ON chat_interactions (intent);
CREATE INDEX IF NOT EXISTS idx_interactions_feedback ON chat_interactions (feedback);

-- ---------------------------------------------------------------------------
-- Tabela de Amostragem de VRAM da GPU (Homelab Ollama)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gpu_vram_samples (
  id BIGSERIAL PRIMARY KEY,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vram_used_mb INTEGER NOT NULL,
  model_total_mb INTEGER NOT NULL,
  cpu_spill_mb INTEGER NOT NULL DEFAULT 0,
  models JSONB NOT NULL DEFAULT '[]',
  queue_active SMALLINT,
  queue_waiting SMALLINT,
  queue_max SMALLINT
);

CREATE INDEX IF NOT EXISTS idx_vram_sampled_at ON gpu_vram_samples (sampled_at DESC);

