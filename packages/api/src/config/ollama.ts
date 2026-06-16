/**
 * Módulo de integração com o Ollama (LLM remoto no homelab).
 *
 * Centraliza todas as chamadas HTTP ao Ollama, facilitando a troca de modelos
 * e a reutilização entre os serviços de embedding e RAG.
 *
 * Variáveis de ambiente necessárias:
 * OLLAMA_BASE_URL    — URL base do Ollama (ex: http://192.168.31.50:11434)
 * OLLAMA_EMBED_MODEL — Modelo de embeddings (ex: bge-m3, 1024 dimensões)
 * OLLAMA_LLM_MODEL   — Modelo de geração (ex: qwen3.5:2b-q4_K_M)
 */

import type { Response } from "express";

/** URL base do Ollama — configurável via .env */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

/** Modelo de embeddings — 1024 dimensões para bge-m3 (multilíngue) */
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "bge-m3";

/** Modelo de geração de texto (LLM) */
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:4b";

/** Modelo para reescrita de queries (pode ser o mesmo ou mais leve) */
const REWRITE_MODEL = process.env.OLLAMA_REWRITE_MODEL || "qwen3.5:4b";

/**
 * Context window máximo por requisição.
 * Limita a alocação de VRAM do Ollama para suportar mais usuários simultâneos.
 */
const NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 8192;

/**
 * Timeout global de segurança para as chamadas do Ollama.
 * Impede o erro UND_ERR_HEADERS_TIMEOUT liberando a thread do Node.js
 * caso a GPU demore muito tempo a processar o prompt.
 */
const FETCH_TIMEOUT_MS = 180000; // 3 minutos

// ---------------------------------------------------------------------------
// Utilitários de Contexto
// ---------------------------------------------------------------------------

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Poda o histórico de conversas preservando as diretivas do sistema.
 * * Previne o "Context Bloat" e o erro de Timeout garantindo que a GPU não seja
 * asfixiada com histórico irrelevante, mantendo SEMPRE o System Prompt intacto.
 */
function podarHistorico(mensagens: OllamaChatMessage[], maxInteracoes: number = 4): OllamaChatMessage[] {
  // Se o array já for pequeno, não faz nada
  if (mensagens.length <= maxInteracoes + 1) return mensagens;

  // Separa o system prompt (geralmente a primeira mensagem) do resto
  const systemPrompt = mensagens.find(m => m.role === "system");
  const outrasMensagens = mensagens.filter(m => m.role !== "system");

  // Pega apenas as interações mais recentes
  const mensagensRecentes = outrasMensagens.slice(-maxInteracoes);

  // Remonta o array garantindo que o Agente não esqueça as suas regras vitais
  return systemPrompt ? [systemPrompt, ...mensagensRecentes] : mensagensRecentes;
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export async function verificarOllama(): Promise<void> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(10000) // Timeout rápido de 10s para health check
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = (await response.json()) as { models?: { name: string }[] };
    const modelos = data.models?.map((m) => m.name) || [];
    console.log(`✅ [Ollama] Conectado em ${OLLAMA_BASE_URL}`);
    console.log(`   Modelos disponíveis: ${modelos.join(", ") || "nenhum"}`);
  } catch (error) {
    console.error(`❌ [Ollama] Servidor inacessível em ${OLLAMA_BASE_URL}`);
    console.error("   Verifique se o Ollama está rodando e a variável OLLAMA_BASE_URL");
  }
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

export async function gerarEmbeddingOllama(texto: string): Promise<number[]> {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: texto,
      keep_alive: "24h",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Ollama Embedding] Erro ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { embedding: number[] };

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error("[Ollama Embedding] Resposta inválida — campo 'embedding' ausente");
  }

  return data.embedding;
}

// ---------------------------------------------------------------------------
// Geração de Texto (LLM) — Modo sem streaming
// ---------------------------------------------------------------------------

export async function gerarRespostaOllama(mensagens: OllamaChatMessage[]): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const mensagensSeguras = podarHistorico(mensagens);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: mensagensSeguras,
      stream: false,
      keep_alive: "24h",
      options: { num_ctx: NUM_CTX },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Ollama LLM] Erro ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { message?: { content: string }; error?: string };

  if (data.error) {
    throw new Error(`[Ollama LLM] Erro do Ollama: ${data.error}`);
  }

  if (!data.message || typeof data.message.content !== "string") {
    console.error("❌ [Ollama LLM] Resposta inválida:", JSON.stringify(data));
    throw new Error("[Ollama LLM] Resposta inválida — campo 'message.content' ausente ou inválido");
  }

  return data.message.content;
}

// ---------------------------------------------------------------------------
// Reescrita de Query (Query Rewriting)
// ---------------------------------------------------------------------------

export async function reescreverComLLM(systemPrompt: string, pergunta: string): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: REWRITE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pergunta },
      ],
      stream: false,
      keep_alive: "24h",
      options: {
        temperature: 0,
        num_ctx: NUM_CTX,
        num_predict: 100,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Ollama Rewrite] Erro ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { message?: { content: string }; error?: string };

  if (data.error) {
    throw new Error(`[Ollama Rewrite] Erro do Ollama: ${data.error}`);
  }

  if (!data.message || typeof data.message.content !== "string") {
    console.error("❌ [Ollama Rewrite] Resposta inválida:", JSON.stringify(data));
    throw new Error("[Ollama Rewrite] Resposta inválida — campo 'message.content' ausente ou inválido");
  }

  return data.message.content.trim();
}

// ---------------------------------------------------------------------------
// Geração de Texto (LLM) — Modo STREAMING (SSE)
// ---------------------------------------------------------------------------

export async function streamRespostaOllama(
  mensagens: OllamaChatMessage[],
  res: Response,
  fontes: string[]
): Promise<void> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const mensagensSeguras = podarHistorico(mensagens);

  res.write(`data: ${JSON.stringify({ type: "fontes", fontes })}\n\n`);

  const ollamaResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: mensagensSeguras,
      stream: true,
      keep_alive: "24h",
      options: { num_ctx: NUM_CTX },
    }),
  });

  if (!ollamaResponse.ok) {
    const errorText = await ollamaResponse.text();
    throw new Error(`[Ollama LLM Stream] Erro ${ollamaResponse.status}: ${errorText}`);
  }

  if (!ollamaResponse.body) {
    throw new Error("[Ollama LLM Stream] Corpo da resposta vazio");
  }

  const reader = ollamaResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gerouTokens = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed) as {
            message?: { content: string };
            error?: string;
            done?: boolean;
          };

          if (chunk.error) {
            console.error("❌ [Ollama LLM Stream] Erro retornado no chunk:", chunk.error);
          }

          if (chunk.message?.content) {
            gerouTokens = true;
            res.write(`data: ${JSON.stringify({ type: "token", content: chunk.message.content })}\n\n`);
          }

          if (chunk.done) {
            console.log("🤖 [Stream] Geração concluída pelo Ollama");
          }
        } catch {
          // Ignora linhas inválidas
        }
      }
    }

    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim()) as { message?: { content: string } };
        if (chunk.message?.content) {
          gerouTokens = true;
          res.write(`data: ${JSON.stringify({ type: "token", content: chunk.message.content })}\n\n`);
        }
      } catch {
        // Ignora
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Se nenhum token foi gerado, envia um fallback amigável
  if (!gerouTokens) {
    console.warn("⚠️ [Ollama] Resposta vazia no streaming. Enviando fallback.");
    const fallbackMsg = "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso ou acessar o portal do IFMG.";
    res.write(
      `data: ${JSON.stringify({ type: "token", content: fallbackMsg })}\n\n`
    );
  }

  res.write(`data: [DONE]\n\n`);
}