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

/** Pool de conexões do PostgreSQL */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Testa a conexão com o banco de dados.
 * Chamada na inicialização do servidor para validar que o banco está acessível.
 */
export async function testarConexaoDB(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as agora");
    console.log(
      `✅ [Database] Conectado ao PostgreSQL — ${result.rows[0].agora}`
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
