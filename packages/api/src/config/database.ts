import pg from "pg";

/**
 * Módulo de conexão com o PostgreSQL.
 *
 * Utiliza um Pool de conexões para reutilizar conexões entre requisições,
 * evitando o custo de abrir/fechar conexões a cada query.
 *
 * A connection string é lida da variável de ambiente DATABASE_URL.
 */

const { Pool } = pg;

/** Dimensão esperada para os embeddings (bge-m3 = 1024) */
const EXPECTED_EMBEDDING_DIM = 1024;

/** Pool de conexões do PostgreSQL com configuração otimizada */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                        // Máximo de conexões simultâneas
  idleTimeoutMillis: 120_000,      // Fecha conexões ociosas após 120s
  connectionTimeoutMillis: 60_000, // Timeout para obter conexão do pool
});

/**
 * Testa a conexão com o banco de dados.
 * Chamada na inicialização do servidor para validar que o banco está acessível.
 */
export async function testDBConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as now");
    console.log(
      `✅ [Database] Conectado ao PostgreSQL — ${result.rows[0].now}`
    );
    client.release();
  } catch (error) {
    console.error("❌ [Database] Falha ao conectar ao PostgreSQL:", error);
    console.error(
      "   Verifique a variável DATABASE_URL no arquivo .env"
    );
    // Não encerra o processo — permite que a API suba mesmo sem banco
    // para facilitar o desenvolvimento do frontend
  }
}

/**
 * Verifica a dimensão da coluna embedding e auto-migra se necessário.
 *
 * Cenário: o banco foi criado com nomic-embed-text (768d) e o modelo
 * foi trocado para bge-m3 (1024d). Sem esta migração, todos os INSERTs
 * falham com "expected 768 dimensions, not 1024".
 *
 * A migração é idempotente — se já está em 1024d, não faz nada.
 *
 * ⚠️  DESTRUTIVA: remove todos os embeddings existentes (incompatíveis).
 */
export async function verifyEmbeddingDimension(): Promise<void> {
  try {
    // Verifica se a tabela documents existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'documents'
      ) AS exists
    `);

    if (!tableExists.rows[0]?.exists) {
      console.log("⏭️  [Database] Tabela 'documents' não existe ainda. Pulando verificação de dimensão.");
      return;
    }

    // Consulta a dimensão atual da coluna embedding via atttypmod
    const result = await pool.query(`
      SELECT atttypmod AS dim
      FROM pg_attribute
      WHERE attrelid = 'documents'::regclass
        AND attname = 'embedding'
    `);

    if (result.rows.length === 0) {
      console.warn("⚠️  [Database] Coluna 'embedding' não encontrada na tabela 'documents'.");
      return;
    }

    const currentDim = result.rows[0].dim;

    if (currentDim === EXPECTED_EMBEDDING_DIM) {
      console.log(`✅ [Database] Dimensão do embedding: ${currentDim}d ✓`);
      return;
    }

    // ── Auto-migração ──
    console.warn(
      `⚠️  [Database] Dimensão incompatível detectada: ${currentDim}d (esperado: ${EXPECTED_EMBEDDING_DIM}d)`
    );
    console.log(`🔄 [Database] Iniciando auto-migração ${currentDim}d → ${EXPECTED_EMBEDDING_DIM}d...`);

    // Verifica quantos registros serão perdidos
    const countResult = await pool.query(`SELECT COUNT(*) AS total FROM documents WHERE embedding IS NOT NULL`);
    const existingRecords = Number(countResult.rows[0]?.total || 0);

    if (existingRecords > 0) {
      console.warn(
        `⚠️  [Database] ${existingRecords} registro(s) com embeddings serão invalidados. ` +
        `Re-uploade os documentos após a migração.`
      );
    }

    // Executa a migração
    await pool.query(`DROP INDEX IF EXISTS idx_documents_embedding`);
    await pool.query(`ALTER TABLE documents DROP COLUMN IF EXISTS embedding`);
    await pool.query(`ALTER TABLE documents ADD COLUMN embedding vector(${EXPECTED_EMBEDDING_DIM})`);
    await pool.query(`
      CREATE INDEX idx_documents_embedding
        ON documents USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 200)
    `);

    console.log(
      `✅ [Database] Auto-migração concluída! Embedding agora é ${EXPECTED_EMBEDDING_DIM}d (HNSW).`
    );

    if (existingRecords > 0) {
      console.warn(
        `⚠️  [Database] AÇÃO NECESSÁRIA: Re-uploade os ${existingRecords} documento(s) via /api/embedding/upload`
      );
    }
  } catch (error) {
    console.error(
      "❌ [Database] Falha na verificação/migração de dimensão:",
      error instanceof Error ? error.message : error
    );
    // Não encerra — loga o erro e continua
  }
}

