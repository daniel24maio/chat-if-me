-- ==========================================================================
-- Migração: nomic-embed-text (768d) → bge-m3 (1024d)
--
-- Esta migração é IDEMPOTENTE: verifica a dimensão atual antes de agir.
-- Se o banco já está em 1024d, não faz nada.
--
-- Executar no banco de dados ANTES de re-uploadar os documentos:
--   psql -U chatifme -d chatifme -f migrate_bge_m3.sql
--
-- ATENÇÃO: Se aplicada, esta migração REMOVE todos os embeddings existentes.
-- Os documentos precisam ser re-uploadados após a execução.
-- ==========================================================================

DO $$
DECLARE
  dim_atual INTEGER;
BEGIN
  -- Verificar dimensão atual da coluna embedding
  SELECT atttypmod INTO dim_atual
  FROM pg_attribute
  WHERE attrelid = 'documents'::regclass
    AND attname = 'embedding';

  IF dim_atual IS NULL THEN
    RAISE NOTICE 'Coluna embedding não encontrada. Nada a fazer.';
    RETURN;
  END IF;

  -- atttypmod para vector armazena a dimensão diretamente
  IF dim_atual = 1024 THEN
    RAISE NOTICE 'Embedding já está com 1024 dimensões. Migração não necessária.';
    RETURN;
  END IF;

  RAISE NOTICE 'Dimensão atual: %. Migrando para 1024...', dim_atual;

  -- 1. Dropar índice existente (IVFFlat ou HNSW)
  DROP INDEX IF EXISTS idx_documents_embedding;

  -- 2. Remover coluna antiga e recriar com nova dimensão
  ALTER TABLE documents DROP COLUMN IF EXISTS embedding;
  ALTER TABLE documents ADD COLUMN embedding vector(1024);

  -- 3. Recriar índice usando HNSW (superior ao IVFFlat para < 100k registros)
  CREATE INDEX idx_documents_embedding
    ON documents USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

  RAISE NOTICE 'Migração concluída! Dimensão alterada para 1024. Re-uploade os documentos.';
END
$$;
