/**
 * Módulo de integração com o Ollama (LLM remoto no homelab).
 *
 * Centraliza todas as chamadas HTTP ao Ollama, facilitando a troca de modelos
 * e a reutilização entre os serviços de embedding e RAG.
 *
 * Variáveis de ambiente necessárias:
 *   OLLAMA_BASE_URL    — URL base do Ollama (ex: http://192.168.31.50:11434)
 *   OLLAMA_EMBED_MODEL — Modelo de embeddings (ex: nomic-embed-text)
 *   OLLAMA_LLM_MODEL   — Modelo de geração (ex: qwen2.5:latest)
 */

import type { Response } from "express";

/** URL base do Ollama — configurável via .env */
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

/** Modelo de embeddings — 768 dimensões para nomic-embed-text */
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

/** Modelo de geração de texto (LLM) */
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:latest";

/** Modelo para reescrita de queries (pode ser o mesmo ou mais leve) */
const REWRITE_MODEL = process.env.OLLAMA_REWRITE_MODEL || "qwen3.5:latest";

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

/**
 * Verifica se o servidor Ollama está acessível.
 * Chamada na inicialização do servidor.
 */
export async function verificarOllama(): Promise<void> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = (await response.json()) as { models?: { name: string }[] };
    const modelos = data.models?.map((m) => m.name) || [];
    console.log(`✅ [Ollama] Conectado em ${OLLAMA_BASE_URL}`);
    console.log(`   Modelos disponíveis: ${modelos.join(", ") || "nenhum"}`);
  } catch (error) {
    console.error(`❌ [Ollama] Servidor inacessível em ${OLLAMA_BASE_URL}`);
    console.error(
      "   Verifique se o Ollama está rodando e a variável OLLAMA_BASE_URL"
    );
  }
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

/**
 * Gera o vetor de embedding para um texto usando o Ollama.
 *
 * @param texto - Texto a ser vetorizado
 * @returns Vetor numérico (array de floats) com a dimensão do modelo
 * @throws Error se o Ollama estiver offline ou o modelo não estiver disponível
 */
export async function gerarEmbeddingOllama(
  texto: string
): Promise<number[]> {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: texto,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[Ollama Embedding] Erro ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as { embedding: number[] };

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error(
      "[Ollama Embedding] Resposta inválida — campo 'embedding' ausente"
    );
  }

  return data.embedding;
}

// ---------------------------------------------------------------------------
// Geração de Texto (LLM) — Modo sem streaming (mantido para compatibilidade)
// ---------------------------------------------------------------------------

/** Estrutura de mensagem para a API de chat do Ollama */
export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Gera uma resposta textual usando o LLM via Ollama (sem streaming).
 * Mantida para usos onde não se precisa de streaming (ex: testes).
 *
 * @param mensagens - Array de mensagens no formato chat (system prompt + user)
 * @returns Texto da resposta gerada pelo modelo
 */
export async function gerarRespostaOllama(
  mensagens: OllamaChatMessage[]
): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: mensagens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[Ollama LLM] Erro ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as {
    message?: { content: string };
  };

  if (!data.message?.content) {
    throw new Error(
      "[Ollama LLM] Resposta inválida — campo 'message.content' ausente"
    );
  }

  return data.message.content;
}

// ---------------------------------------------------------------------------
// Reescrita de Query (Query Rewriting)
// ---------------------------------------------------------------------------

/**
 * Reescreve uma pergunta usando um LLM para melhorar a busca semântica.
 *
 * Utiliza temperature=0 para máximo determinismo — a reescrita não deve
 * ser criativa, apenas expandir siglas e formalizar a linguagem.
 *
 * @param systemPrompt - Instruções de como reescrever (com dicionário de siglas)
 * @param pergunta     - Pergunta original do aluno
 * @returns Pergunta reescrita e expandida
 * @throws Error se o Ollama estiver offline
 */
export async function reescreverComLLM(
  systemPrompt: string,
  pergunta: string
): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: REWRITE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pergunta },
      ],
      stream: false,
      options: {
        temperature: 0, // Determinístico — sem criatividade na reescrita
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[Ollama Rewrite] Erro ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as {
    message?: { content: string };
  };

  if (!data.message?.content) {
    throw new Error(
      "[Ollama Rewrite] Resposta inválida — campo 'message.content' ausente"
    );
  }

  return data.message.content.trim();
}

// ---------------------------------------------------------------------------
// Geração de Texto (LLM) — Modo STREAMING (SSE)
// ---------------------------------------------------------------------------

/**
 * Faz o streaming da resposta do LLM via Ollama diretamente para o cliente.
 *
 * Fluxo:
 *   1. Envia a requisição ao Ollama com stream: true
 *   2. Lê cada chunk NDJSON que chega do homelab
 *   3. Extrai o campo "message.content" de cada chunk
 *   4. Encaminha cada token para o Response do Express como SSE (data: ...)
 *   5. Envia "data: [DONE]" ao final para o frontend fechar a conexão
 *
 * @param mensagens - Array de mensagens (system prompt + user)
 * @param res       - Objeto Response do Express (já configurado com headers SSE)
 * @param fontes    - Fontes dos documentos recuperados (enviadas no primeiro evento)
 */
export async function streamRespostaOllama(
  mensagens: OllamaChatMessage[],
  res: Response,
  fontes: string[]
): Promise<void> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;

  // Envia as fontes como primeiro evento SSE para o frontend exibir
  res.write(`data: ${JSON.stringify({ type: "fontes", fontes })}\n\n`);

  // Requisição ao Ollama com streaming habilitado
  const ollamaResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: mensagens,
      stream: true,
    }),
  });

  if (!ollamaResponse.ok) {
    const errorText = await ollamaResponse.text();
    throw new Error(
      `[Ollama LLM Stream] Erro ${ollamaResponse.status}: ${errorText}`
    );
  }

  if (!ollamaResponse.body) {
    throw new Error("[Ollama LLM Stream] Corpo da resposta vazio");
  }

  // Lê o stream NDJSON do Ollama e encaminha cada token ao cliente
  const reader = ollamaResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Acumula dados no buffer (chunks podem vir parciais)
      buffer += decoder.decode(value, { stream: true });

      // Processa cada linha NDJSON completa no buffer
      const lines = buffer.split("\n");
      // A última "linha" pode estar incompleta, mantém no buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed) as {
            message?: { content: string };
            done?: boolean;
          };

          // Extrai o token de texto e envia via SSE
          if (chunk.message?.content) {
            res.write(
              `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}\n\n`
            );
          }

          // Quando o Ollama sinaliza que terminou
          if (chunk.done) {
            console.log("🤖 [Stream] Geração concluída pelo Ollama");
          }
        } catch {
          // Ignora linhas que não são JSON válido (pode ser lixo do buffer)
        }
      }
    }

    // Processa resto do buffer se houver
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim()) as {
          message?: { content: string };
          done?: boolean;
        };
        if (chunk.message?.content) {
          res.write(
            `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}\n\n`
          );
        }
      } catch {
        // Ignora
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Sinaliza fim do stream para o frontend
  res.write(`data: [DONE]\n\n`);
}
