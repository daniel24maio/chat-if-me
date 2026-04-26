-- ==========================================================================
-- Inicialização do banco de dados para o chatIFme
-- Habilita pgvector, FTS com unaccent e cria a tabela de documentos.
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
  -- Identificador único auto-incrementável
  id SERIAL PRIMARY KEY,

  -- Conteúdo textual do trecho (chunk) do documento
  content TEXT NOT NULL,

  -- Metadados em JSON: nome do arquivo, página, data de upload, etc.
  -- Exemplo: {"filename": "PPC_SI_2023.pdf", "page": 12, "chunk_index": 3}
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Vetor de embedding gerado pelo modelo (nomic-embed-text = 768 dimensões)
  embedding vector(768) NOT NULL,

  -- Full-Text Search: tsvector gerado automaticamente a partir do content
  -- Usa configuração portuguese_unaccent para busca sem acentos com stemming
  content_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese_unaccent', content)
  ) STORED,

  -- Data de criação do registro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice IVFFlat para busca por similaridade eficiente (pgvector)
CREATE INDEX IF NOT EXISTS idx_documents_embedding
  ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Índice GIN para Full-Text Search eficiente
CREATE INDEX IF NOT EXISTS idx_documents_fts
  ON documents USING GIN (content_tsv);

-- Índice GIN no campo metadata para consultas JSONB rápidas
CREATE INDEX IF NOT EXISTS idx_documents_metadata
  ON documents USING gin (metadata);
