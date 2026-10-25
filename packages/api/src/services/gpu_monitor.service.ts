/**
 * Serviço de Monitoramento de VRAM da GPU (Homelab Ollama).
 *
 * Coleta periodicamente métricas do endpoint `/api/ps` do Ollama e persiste na tabela
 * `gpu_vram_samples` para diagnósticos de saturação de memória, spill para CPU
 * e correlacionamento com requisições simultâneas.
 *
 * NOTA: Não exposto nas telas de estatísticas públicas/admin para manter foco acadêmico.
 */

import { pool } from "../config/database.js";
import { ollamaSemaphore } from "./queue.service.js";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const SAMPLE_INTERVAL_MS = Number(process.env.VRAM_SAMPLE_INTERVAL_MS) || 5000;
const RETENTION_DAYS = Number(process.env.VRAM_RETENTION_DAYS) || 30;

export interface ModelVramDetail {
  name: string;
  size_mb: number;
  vram_mb: number;
  cpu_spill_mb: number;
}

export interface VramSample {
  timestamp: Date;
  vramUsedMb: number;
  modelTotalMb: number;
  cpuSpillMb: number;
  models: ModelVramDetail[];
  queueActive: number;
  queueWaiting: number;
  queueMax: number;
}

let latestSample: VramSample | null = null;
let samplerIntervalTimer: NodeJS.Timeout | null = null;
let cleanupIntervalTimer: NodeJS.Timeout | null = null;
let lastErrorLogTimestamp = 0;

/**
 * Consulta o endpoint /api/ps do Ollama e formata os dados de VRAM.
 */
export async function queryOllamaVram(): Promise<{
  vramUsedMb: number;
  modelTotalMb: number;
  cpuSpillMb: number;
  models: ModelVramDetail[];
} | null> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/ps`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      models?: Array<{
        name: string;
        size?: number;
        size_vram?: number;
      }>;
    };

    let totalSizeBytes = 0;
    let totalVramBytes = 0;
    const modelDetails: ModelVramDetail[] = [];

    if (Array.isArray(data.models)) {
      for (const m of data.models) {
        const sizeBytes = m.size || 0;
        const vramBytes = m.size_vram || 0;
        totalSizeBytes += sizeBytes;
        totalVramBytes += vramBytes;

        const sizeMb = Math.round(sizeBytes / (1024 * 1024));
        const vramMb = Math.round(vramBytes / (1024 * 1024));
        const spillMb = Math.max(0, sizeMb - vramMb);

        modelDetails.push({
          name: m.name,
          size_mb: sizeMb,
          vram_mb: vramMb,
          cpu_spill_mb: spillMb,
        });
      }
    }

    const modelTotalMb = Math.round(totalSizeBytes / (1024 * 1024));
    const vramUsedMb = Math.round(totalVramBytes / (1024 * 1024));
    const cpuSpillMb = Math.max(0, modelTotalMb - vramUsedMb);

    return {
      vramUsedMb,
      modelTotalMb,
      cpuSpillMb,
      models: modelDetails,
    };
  } catch (error) {
    const now = Date.now();
    // Throttle do log de erro para no máximo 1x por minuto
    if (now - lastErrorLogTimestamp > 60000) {
      lastErrorLogTimestamp = now;
      console.warn(
        `⚠️  [VRAM Monitor] Não foi possível consultar /api/ps do Ollama:`,
        error instanceof Error ? error.message : error
      );
    }
    return null;
  }
}

/**
 * Executa uma amostragem única de VRAM, atualiza a memória e persiste no banco.
 */
export async function sampleAndRecordVram(): Promise<VramSample | null> {
  const vramData = await queryOllamaVram();
  if (!vramData) return latestSample;

  const queueStatus = ollamaSemaphore.getStatus();

  const sample: VramSample = {
    timestamp: new Date(),
    vramUsedMb: vramData.vramUsedMb,
    modelTotalMb: vramData.modelTotalMb,
    cpuSpillMb: vramData.cpuSpillMb,
    models: vramData.models,
    queueActive: queueStatus.active,
    queueWaiting: queueStatus.waiting,
    queueMax: queueStatus.maxConcurrent,
  };

  latestSample = sample;

  // Persistência assíncrona (fire-and-forget)
  pool
    .query(
      `INSERT INTO gpu_vram_samples
        (sampled_at, vram_used_mb, model_total_mb, cpu_spill_mb, models, queue_active, queue_waiting, queue_max)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sample.timestamp,
        sample.vramUsedMb,
        sample.modelTotalMb,
        sample.cpuSpillMb,
        JSON.stringify(sample.models),
        sample.queueActive,
        sample.queueWaiting,
        sample.queueMax,
      ]
    )
    .catch((err) => {
      console.error("❌ [VRAM Monitor] Erro ao salvar amostra de VRAM:", err);
    });

  return sample;
}

/**
 * Retorna a amostra de VRAM mais recente em memória.
 */
export function getLastVramSample(): VramSample | null {
  return latestSample;
}

/**
 * Formata o status atual de VRAM e fila para exibição em logs de pipeline.
 */
export function formatVramStatus(sample?: VramSample | null): string {
  const s = sample ?? latestSample;
  if (!s) {
    const q = ollamaSemaphore.getStatus();
    return `🎮 [VRAM] N/D | fila: ${q.active} ativa(s) / ${q.waiting} aguardando (max: ${q.maxConcurrent})`;
  }

  const vramGb = (s.vramUsedMb / 1024).toFixed(1);
  const spillWarning = s.cpuSpillMb > 0 ? ` ⚠️ [SPILL CPU: ${s.cpuSpillMb} MB]` : "";
  return `🎮 [VRAM] ${vramGb} GB em GPU | spill CPU: ${s.cpuSpillMb} MB${spillWarning} | fila: ${s.queueActive} ativa(s) / ${s.queueWaiting} aguardando (max: ${s.queueMax})`;
}

/**
 * Limpa amostras com mais de N dias para evitar crescimento descontrolado da tabela.
 */
export async function cleanOldVramSamples(): Promise<void> {
  try {
    const res = await pool.query(
      `DELETE FROM gpu_vram_samples WHERE sampled_at < NOW() - ($1 || ' days')::INTERVAL`,
      [RETENTION_DAYS]
    );
    if ((res.rowCount ?? 0) > 0) {
      console.log(`🧹 [VRAM Monitor] Limpeza: ${res.rowCount} amostras antigas removidas (> ${RETENTION_DAYS} dias).`);
    }
  } catch (err) {
    console.error("❌ [VRAM Monitor] Erro ao limpar amostras antigas:", err);
  }
}

/**
 * Inicia o sampler contínuo de VRAM e o agendamento de limpeza diária.
 */
export function startVramSampler(): void {
  if (SAMPLE_INTERVAL_MS <= 0) {
    console.log("ℹ️  [VRAM Monitor] Amostragem automática desativada (VRAM_SAMPLE_INTERVAL_MS <= 0).");
    return;
  }

  console.log(`🎮 [VRAM Monitor] Iniciando monitoramento a cada ${SAMPLE_INTERVAL_MS}ms (Ollama: ${OLLAMA_BASE_URL})`);

  // Executa uma primeira amostragem imediata
  sampleAndRecordVram();

  samplerIntervalTimer = setInterval(() => {
    sampleAndRecordVram();
  }, SAMPLE_INTERVAL_MS);

  // Limpeza diária (a cada 24 horas)
  cleanupIntervalTimer = setInterval(() => {
    cleanOldVramSamples();
  }, 24 * 60 * 60 * 1000);
}

/**
 * Encerra o sampler de VRAM durante o shutdown gracioso do servidor.
 */
export function stopVramSampler(): void {
  if (samplerIntervalTimer) {
    clearInterval(samplerIntervalTimer);
    samplerIntervalTimer = null;
  }
  if (cleanupIntervalTimer) {
    clearInterval(cleanupIntervalTimer);
    cleanupIntervalTimer = null;
  }
}
