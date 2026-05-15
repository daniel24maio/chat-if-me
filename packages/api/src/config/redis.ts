import IORedis from "ioredis";

/**
 * Conexão Redis compartilhada para BullMQ.
 *
 * Configuração:
 *   - maxRetriesPerRequest: null — exigido pelo BullMQ
 *   - enableReadyCheck: false — evita bloqueio na inicialização
 *
 * A URL é configurável via variável de ambiente REDIS_URL.
 * Em produção, o Redis roda como container Docker (docker-compose.yml).
 */
export const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }
);

/**
 * Testa a conexão com o Redis.
 * Chamada na inicialização do servidor para validar que o Redis está acessível.
 */
export async function testarConexaoRedis(): Promise<void> {
  try {
    const pong = await redisConnection.ping();
    console.log(`✅ [Redis] Conectado — ${pong}`);
  } catch (error) {
    console.warn(
      "⚠️  [Redis] Não disponível — fila de concorrência desabilitada.",
      error instanceof Error ? error.message : error
    );
  }
}
