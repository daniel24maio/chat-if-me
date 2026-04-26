-- ==========================================================================
-- Migração: Adicionar suporte a Busca Híbrida (FTS + pgvector)
--
-- Executar no banco existente que já tem dados:
--   psql -U chatifme -d chatifme -f migrate_hybrid.sql
--
-- Esta migração:
--   1. Cria a extensão unaccent
--   2. Cria a configuração portuguese_unaccent (FTS PT-BR sem acentos)
--   3. Adiciona coluna content_tsv (gerada automaticamente)
--   4. Cria índice GIN para FTS
-- ==========================================================================

-- 1. Extensão para remoção de acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Configuração FTS para português sem acentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'portuguese_unaccent'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION public.portuguese_unaccent (COPY = pg_catalog.portuguese);
    ALTER TEXT SEARCH CONFIGURATION public.portuguese_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, portuguese_stem;
    RAISE NOTICE 'Configuração portuguese_unaccent criada com sucesso.';
  ELSE
    RAISE NOTICE 'Configuração portuguese_unaccent já existe.';
  END IF;
END
$$;

-- 3. Adicionar coluna tsvector gerada (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'content_tsv'
  ) THEN
    ALTER TABLE documents
      ADD COLUMN content_tsv tsvector
      GENERATED ALWAYS AS (to_tsvector('portuguese_unaccent', content)) STORED;
    RAISE NOTICE 'Coluna content_tsv adicionada com sucesso.';
  ELSE
    RAISE NOTICE 'Coluna content_tsv já existe.';
  END IF;
END
$$;

-- 4. Índice GIN para FTS
CREATE INDEX IF NOT EXISTS idx_documents_fts
  ON documents USING GIN (content_tsv);

RAISE NOTICE 'Migração concluída! Busca híbrida pronta para uso.';
