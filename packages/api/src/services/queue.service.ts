import { Queue, Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis.js";

/**
 * Serviço de Fila de Concorrência — BullMQ.
 *
 * Serializa requests ao Ollama para evitar OOM na GPU.
 * Cada request de chat/agent é enfileirado e processado um por vez.
 *
 * Arquitetura:
 *   1. Controller adiciona job à fila via `enfileirarChat()`
 *   2. Worker processa jobs sequencialmente (concurrency: 1)
 *   3. O resultado (SSE stream) é feito diretamente no handler
 *
 * Nota: Como SSE requer manter a conexão HTTP aberta, o BullMQ aqui
 * funciona como um semáforo — controla QUANTOS requests processam
 * simultaneamente, não os dados em si.
 */

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/** Número máximo de requests processados simultaneamente pelo Ollama */
const MAX_CONCURRENT = Number(process.env.OLLAMA_MAX_CONCURRENT) || 2;

/** Timeout máximo de espera na fila (ms) */
const QUEUE_TIMEOUT_MS = 120_000; // 2 minutos

/** Nome da fila */
const QUEUE_NAME = "chatifme-llm";

// ---------------------------------------------------------------------------
// Semáforo baseado em BullMQ
// ---------------------------------------------------------------------------

/**
 * Semáforo de concorrência para o Ollama.
 *
 * Em vez de enfileirar dados, usamos um padrão de "acquire/release":
 * - `acquire()`: espera até que haja um slot disponível
 * - `release()`: libera o slot para o próximo request
 *
 * Isso permite manter o SSE streaming funcionando normalmente
 * enquanto limita a concorrência no Ollama.
 */
class OllamaSemaphore {
  private currentCount = 0;
  private waitQueue: Array<{ resolve: () => void; timer: ReturnType<typeof setTimeout> }> = [];

  constructor(private maxConcurrent: number) {}

  /**
   * Aguarda até que um slot esteja disponível.
   * @throws Error se o timeout for atingido
   */
  async acquire(): Promise<void> {
    if (this.currentCount < this.maxConcurrent) {
      this.currentCount++;
      return;
    }

    // Sem slot disponível — entra na fila de espera
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Remove da fila de espera
        const idx = this.waitQueue.findIndex((w) => w.resolve === resolve);
        if (idx !== -1) this.waitQueue.splice(idx, 1);
        reject(new Error("Tempo de espera na fila esgotado. Tente novamente."));
      }, QUEUE_TIMEOUT_MS);

      this.waitQueue.push({ resolve, timer });
    });
  }

  /** Libera um slot, desbloqueando o próximo request na fila. */
  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      clearTimeout(next.timer);
      next.resolve();
    } else {
      this.currentCount = Math.max(0, this.currentCount - 1);
    }
  }

  /** Retorna métricas da fila para observabilidade. */
  getStatus(): { active: number; waiting: number; maxConcurrent: number } {
    return {
      active: this.currentCount,
      waiting: this.waitQueue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

/** Instância global do semáforo */
export const ollamaSemaphore = new OllamaSemaphore(MAX_CONCURRENT);

/**
 * Wrapper que executa uma função com controle de concorrência.
 *
 * Uso nos controllers:
 * ```ts
 * await comControledeConcorrencia(async () => {
 *   await processarPerguntaStream(pergunta, res);
 * });
 * ```
 */
export async function comControleDeConcorrencia<T>(
  fn: () => Promise<T>
): Promise<T> {
  await ollamaSemaphore.acquire();
  try {
    return await fn();
  } finally {
    ollamaSemaphore.release();
  }
}
