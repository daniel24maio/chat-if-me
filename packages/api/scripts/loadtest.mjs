#!/usr/bin/env node
/**
 * Script de Teste de Carga e Benchmark de Concorrência do Chat-IF-ME.
 *
 * Avalia o comportamento de inferência sob múltiplas requisições simultâneas,
 * medindo:
 *   - TTFT (Time To First Token) p50 / p95 / média
 *   - Duração total de resposta
 *   - Vazão de tokens gerados (tokens/segundo)
 *   - Consumo de VRAM no Ollama (/api/ps)
 *   - Detecção de transbordamento (spill) para a CPU (RAM)
 *
 * Uso:
 *   node scripts/loadtest.mjs --concurrency 4 --rounds 1 --label "p10-ctx10240-q80"
 *   node scripts/loadtest.mjs --url "http://localhost:3333" --concurrency 10
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Argumentos CLI ──
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultValue;
}

const API_URL = getArg("--url", process.env.API_URL || "http://localhost:3333");
const OLLAMA_URL = getArg("--ollama", process.env.OLLAMA_BASE_URL || "http://localhost:11434");
const CONCURRENCY = parseInt(getArg("--concurrency", "4"), 10);
const ROUNDS = parseInt(getArg("--rounds", "1"), 10);
const MODE = getArg("--mode", "rag"); // "rag" | "agent" | "agent_beta"
const LABEL = getArg("--label", `c${CONCURRENCY}_${Date.now()}`);

// ── Perguntas Acadêmicas Realistas para o Benchmark ──
const BENCHMARK_QUESTIONS = [
  "qual o tempo maximo de integralização do curso de sistemas de informação?",
  "o que acontece se eu ultrapassar o prazo de integralização do curso?",
  "quais são os critérios de aprovação e limite de faltas no IFMG?",
  "como funciona a matrícula em disciplinas e o trancamento de curso?",
  "quais são os pré-requisitos e regras para a entrega do TCC?",
  "como comprovar as horas de atividades complementares obrigatórias?",
  "qual a diferença entre dependência de disciplina e exame final?",
  "como funciona o regime de exercícios domiciliares por atestado?",
  "qual a estrutura curricular e carga horária do curso de computação?",
  "o que é necessário para colar grau e emitir o diploma?",
];

/**
 * Consulta VRAM atual do Ollama via /api/ps.
 */
async function queryOllamaVram() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/ps`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    let totalSizeBytes = 0;
    let totalVramBytes = 0;
    const models = [];

    if (Array.isArray(data.models)) {
      for (const m of data.models) {
        const size = m.size || 0;
        const vram = m.size_vram || 0;
        totalSizeBytes += size;
        totalVramBytes += vram;
        models.push({
          name: m.name,
          sizeMb: Math.round(size / 1024 / 1024),
          vramMb: Math.round(vram / 1024 / 1024),
          spillMb: Math.max(0, Math.round((size - vram) / 1024 / 1024)),
        });
      }
    }

    const modelTotalMb = Math.round(totalSizeBytes / 1024 / 1024);
    const vramUsedMb = Math.round(totalVramBytes / 1024 / 1024);
    const cpuSpillMb = Math.max(0, modelTotalMb - vramUsedMb);

    return { vramUsedMb, modelTotalMb, cpuSpillMb, models };
  } catch {
    return null;
  }
}

/**
 * Envia uma pergunta ao chat e consome o stream SSE medindo latência.
 */
async function runSingleRequest(question, index) {
  const sessionId = `loadtest-${LABEL}-${Date.now()}-${index}`;
  const endpoint = MODE === "agent" ? "/api/agent" : MODE === "agent_beta" ? "/api/agent-beta" : "/api/chat";
  const start = Date.now();
  let firstTokenAt = null;
  let tokenCount = 0;
  let fullResponse = "";
  let errorMsg = null;

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, sessionId }),
      signal: AbortSignal.timeout(180000), // 3 min max
    });

    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);

        if (payload === "[DONE]") break;

        try {
          const event = JSON.parse(payload);
          if (event.type === "token" && event.content) {
            if (firstTokenAt === null) {
              firstTokenAt = Date.now();
            }
            tokenCount += 1;
            fullResponse += event.content;
          } else if (event.type === "error") {
            errorMsg = event.message || "Erro no stream SSE";
          }
        } catch {
          // ignore non-JSON
        }
      }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const end = Date.now();
  const totalMs = end - start;
  const ttftMs = firstTokenAt !== null ? firstTokenAt - start : null;
  const tokensPerSec =
    ttftMs !== null && totalMs > ttftMs && tokenCount > 0
      ? Math.round((tokenCount / ((totalMs - ttftMs) / 1000)) * 10) / 10
      : null;

  return {
    index,
    question,
    success: !errorMsg && tokenCount > 0,
    error: errorMsg,
    totalMs,
    ttftMs,
    tokenCount,
    tokensPerSec,
  };
}

/**
 * Utilitário de percentil (p50, p95).
 */
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log(`\n============================================================`);
  console.log(`🚀 Chat-IF-ME — Teste de Carga de Concorrência & VRAM`);
  console.log(`============================================================`);
  console.log(`📍 API Endpoint:   ${API_URL}`);
  console.log(`🎮 Ollama URL:     ${OLLAMA_URL}`);
  console.log(`⚡ Concorrência:   ${CONCURRENCY} requisições simultâneas`);
  console.log(`🔄 Rodadas:        ${ROUNDS}`);
  console.log(`🎯 Modo:           ${MODE}`);
  console.log(`🏷️  Rótulo:         ${LABEL}`);
  console.log(`============================================================\n`);

  // 1. Verificação inicial de VRAM (Repouso)
  console.log(`🔍 Verificando estado inicial da GPU no Ollama (/api/ps)...`);
  const initialVram = await queryOllamaVram();
  if (initialVram) {
    console.log(`   GPU VRAM em uso:  ${(initialVram.vramUsedMb / 1024).toFixed(2)} GB`);
    console.log(`   Spill para CPU:   ${initialVram.cpuSpillMb} MB`);
    if (initialVram.models.length > 0) {
      console.log(`   Modelos ativos:   ${initialVram.models.map((m) => `${m.name} (${m.vramMb}MB GPU)`).join(", ")}`);
    } else {
      console.log(`   (Nenhum modelo carregado na GPU no momento — será carregado no aquecimento)`);
    }
  } else {
    console.warn(`   ⚠️ Não foi possível obter dados de /api/ps (Ollama offline ou porta inacessível)`);
  }

  // 2. Aquecimento do modelo
  console.log(`\n🔥 Executando aquecimento (Warmup) com 1 requisição...`);
  const warmupRes = await runSingleRequest(BENCHMARK_QUESTIONS[0], 0);
  console.log(
    `   Warmup concluído em ${(warmupRes.totalMs / 1000).toFixed(1)}s ` +
    `(TTFT: ${warmupRes.ttftMs ?? "N/D"}ms, tokens: ${warmupRes.tokenCount})`
  );

  let peakVramMb = initialVram?.vramUsedMb ?? 0;
  let maxCpuSpillMb = initialVram?.cpuSpillMb ?? 0;

  const allResults = [];

  for (let r = 1; r <= ROUNDS; r++) {
    console.log(`\n🏁 [Rodada ${r}/${ROUNDS}] Disparando ${CONCURRENCY} requisições concorrentes...`);

    // Amostragem de VRAM em background durante o burst
    let isBurstRunning = true;
    const vramSampler = setInterval(async () => {
      if (!isBurstRunning) return;
      const v = await queryOllamaVram();
      if (v) {
        if (v.vramUsedMb > peakVramMb) peakVramMb = v.vramUsedMb;
        if (v.cpuSpillMb > maxCpuSpillMb) maxCpuSpillMb = v.cpuSpillMb;
      }
    }, 1000);

    const questions = Array.from({ length: CONCURRENCY }, (_, i) => {
      return BENCHMARK_QUESTIONS[i % BENCHMARK_QUESTIONS.length];
    });

    const roundStart = Date.now();
    const roundPromises = questions.map((q, i) => runSingleRequest(q, i + 1));
    const roundResults = await Promise.all(roundPromises);
    isBurstRunning = false;
    clearInterval(vramSampler);

    const roundDuration = Date.now() - roundStart;
    console.log(`⏱️  Rodada ${r} finalizada em ${(roundDuration / 1000).toFixed(2)}s`);

    allResults.push(...roundResults);
  }

  // ── Cálculo de Estatísticas ──
  const successCount = allResults.filter((r) => r.success).length;
  const failureCount = allResults.length - successCount;
  const ttftValues = allResults.map((r) => r.ttftMs).filter((v) => typeof v === "number");
  const durationValues = allResults.map((r) => r.totalMs);
  const tokensPerSecValues = allResults.map((r) => r.tokensPerSec).filter((v) => typeof v === "number");

  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

  const stats = {
    label: LABEL,
    concurrency: CONCURRENCY,
    rounds: ROUNDS,
    totalRequests: allResults.length,
    successCount,
    failureCount,
    ttft: {
      min: ttftValues.length ? Math.min(...ttftValues) : 0,
      mean: avg(ttftValues),
      p50: percentile(ttftValues, 50),
      p95: percentile(ttftValues, 95),
      max: ttftValues.length ? Math.max(...ttftValues) : 0,
    },
    duration: {
      min: Math.min(...durationValues),
      mean: avg(durationValues),
      p50: percentile(durationValues, 50),
      p95: percentile(durationValues, 95),
      max: Math.max(...durationValues),
    },
    throughput: {
      avgTokensPerSecPerRequest: avg(tokensPerSecValues),
      totalTokensGenerated: allResults.reduce((acc, r) => acc + r.tokenCount, 0),
    },
    gpu: {
      peakVramMb,
      peakVramGb: (peakVramMb / 1024).toFixed(2),
      maxCpuSpillMb,
      zeroSpill: maxCpuSpillMb === 0,
    },
  };

  // ── Exibição da Tabela no Terminal ──
  console.log(`\n============================================================`);
  console.log(`📊 RESULTADOS DO BENCHMARK: ${LABEL}`);
  console.log(`============================================================`);
  console.log(`✅ Sucesso:              ${stats.successCount} / ${stats.totalRequests} (${((stats.successCount / stats.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`❌ Falhas:               ${stats.failureCount}`);
  console.log(`------------------------------------------------------------`);
  console.log(`⏱️  TTFT (1º token):      p50: ${stats.ttft.p50}ms | p95: ${stats.ttft.p95}ms | Média: ${stats.ttft.mean}ms`);
  console.log(`⏳ Duração Total:        p50: ${(stats.duration.p50 / 1000).toFixed(1)}s | p95: ${(stats.duration.p95 / 1000).toFixed(1)}s | Média: ${(stats.duration.mean / 1000).toFixed(1)}s`);
  console.log(`⚡ Vazão Geração:        ${stats.throughput.avgTokensPerSecPerRequest} tokens/s (por stream)`);
  console.log(`------------------------------------------------------------`);
  console.log(`🎮 VRAM Pico na GPU:     ${stats.gpu.peakVramGb} GB (${stats.gpu.peakVramMb} MB)`);
  console.log(`💾 Transbordo CPU:       ${stats.gpu.maxCpuSpillMb} MB ${stats.gpu.maxCpuSpillMb > 0 ? "⚠️ [CPU SPILL!]" : "✅ [100% GPU]"}`);
  console.log(`============================================================\n`);

  // ── Salvar Arquivo JSON para Histórico ──
  try {
    const outDir = resolve(__dirname, "../../../docs/loadtest");
    mkdirSync(outDir, { recursive: true });
    const outPath = resolve(outDir, `loadtest_${Date.now()}_${LABEL}.json`);
    writeFileSync(outPath, JSON.stringify({ stats, results: allResults }, null, 2), "utf-8");
    console.log(`💾 Relatório gravado com sucesso em:\n   ${outPath}\n`);
  } catch (err) {
    console.error("Erro ao salvar relatório JSON:", err);
  }
}

main().catch((err) => {
  console.error("Falha fatal no script de carga:", err);
  process.exit(1);
});
