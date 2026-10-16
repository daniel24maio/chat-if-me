/**
 * Coleta de métricas de back-end por requisição.
 *
 * Usa AsyncLocalStorage: o controller (via `withConcurrencyControl`) abre um
 * contexto por requisição e qualquer código chamado a partir dele (Ollama,
 * agentes MCP, analytics) pode registrar ou ler métricas sem receber
 * parâmetros extras. Ao final, `logInteraction` persiste o resumo na tabela
 * `chat_interactions` para análise posterior.
 */

import { AsyncLocalStorage } from "node:async_hooks";

/** Estatísticas de uma chamada individual ao LLM (Ollama). */
export interface LlmCallStats {
  /** Etapa do pipeline: "rewrite" | "tool_decision" | "generation" | "generate" */
  step: string;
  model: string;
  /** Tempo de parede da chamada, medido no Node (ms). */
  wall_ms: number;
  /** Tempo até o primeiro token desta chamada (somente streaming, ms). */
  ttft_ms?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  /** Tempo de carregamento do modelo na GPU, informado pelo Ollama (ms). */
  load_ms?: number;
  /** Tempo de avaliação do prompt (prefill), informado pelo Ollama (ms). */
  prompt_eval_ms?: number;
  /** Tempo de geração dos tokens, informado pelo Ollama (ms). */
  eval_ms?: number;
  /** Vazão de geração (tokens por segundo) = completion_tokens / eval_ms. */
  tokens_per_s?: number;
}

/** Campos de contabilização que o Ollama devolve no payload final (durações em ns). */
export interface OllamaUsagePayload {
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface RequestMetrics {
  /** Instante em que a requisição entrou na fila do semáforo. */
  enqueuedAt: number;
  /** Instante em que o slot foi obtido e o pipeline começou. */
  acquiredAt: number;
  /** Tempo de espera na fila (ms). */
  queueWaitMs: number;
  /** Requisições ativas / aguardando no momento em que esta chegou. */
  activeOnEnqueue: number;
  waitingOnEnqueue: number;
  /** Instante do primeiro token enviado ao cliente. */
  firstTokenAt?: number;
  llmCalls: LlmCallStats[];
  /** Tempo acumulado em chamadas de ferramenta MCP (ms). */
  toolMs: number;
  /** Número de chamadas de ferramenta MCP executadas. */
  toolInvocations: number;
  /** O pipeline respondeu com mensagem de contingência (modelo não produziu resposta). */
  fallback: boolean;
}

const storage = new AsyncLocalStorage<RequestMetrics>();

/** Executa `fn` dentro de um contexto de métricas da requisição. */
export function runWithRequestMetrics<T>(ctx: RequestMetrics, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

/** Retorna o contexto da requisição atual (ou undefined fora de uma requisição). */
export function getRequestMetrics(): RequestMetrics | undefined {
  return storage.getStore();
}

/** Registra o instante do primeiro token enviado ao cliente (só a primeira chamada vale). */
export function markFirstToken(): void {
  const ctx = storage.getStore();
  if (ctx && ctx.firstTokenAt === undefined) {
    ctx.firstTokenAt = Date.now();
  }
}

/** Sinaliza que a resposta final foi uma mensagem de contingência. */
export function markFallback(): void {
  const ctx = storage.getStore();
  if (ctx) ctx.fallback = true;
}

/** Acumula o tempo gasto em uma chamada de ferramenta MCP. */
export function recordToolTime(ms: number): void {
  const ctx = storage.getStore();
  if (ctx) {
    ctx.toolMs += ms;
    ctx.toolInvocations += 1;
  }
}

/**
 * Registra uma chamada ao LLM. `usage` é o payload do Ollama (resposta não
 * streaming ou chunk final com `done: true`).
 */
export function recordLlmCall(
  step: string,
  model: string,
  wallMs: number,
  usage?: OllamaUsagePayload,
  ttftMs?: number
): void {
  const ctx = storage.getStore();
  if (!ctx) return;

  const nsToMs = (ns?: number) => (typeof ns === "number" ? Math.round(ns / 1e6) : undefined);
  const evalMs = nsToMs(usage?.eval_duration);
  const completion = usage?.eval_count;

  ctx.llmCalls.push({
    step,
    model,
    wall_ms: wallMs,
    ttft_ms: ttftMs,
    prompt_tokens: usage?.prompt_eval_count,
    completion_tokens: completion,
    load_ms: nsToMs(usage?.load_duration),
    prompt_eval_ms: nsToMs(usage?.prompt_eval_duration),
    eval_ms: evalMs,
    tokens_per_s:
      completion !== undefined && evalMs && evalMs > 0
        ? Math.round((completion / (evalMs / 1000)) * 10) / 10
        : undefined,
  });
}
