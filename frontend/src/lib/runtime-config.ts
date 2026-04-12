import type { RuntimeConfig } from "../types";

export type RuntimePreset = "demo" | "power" | "max";

export function applyRuntimePreset(preset: RuntimePreset, current: RuntimeConfig): RuntimeConfig {
  const base = {
    ...current,
    model_filename: current.model_filename || "Bonsai-8B.gguf",
    model_variant: current.model_variant || "8B",
    ctx_size: 0,
    gpu_layers: 99,
  };

  if (preset === "demo") {
    return {
      ...base,
      temperature: 0.5,
      top_k: 20,
      top_p: 0.85,
      min_p: 0,
      max_tokens: 512,
      reasoning_budget: 0,
      reasoning_format: "none",
      enable_thinking: false,
    };
  }

  if (preset === "max") {
    return {
      ...base,
      temperature: 0.65,
      top_k: 48,
      top_p: 0.95,
      min_p: 0,
      max_tokens: 1536,
      reasoning_budget: -1,
      reasoning_format: "none",
      enable_thinking: true,
    };
  }

  return {
    ...base,
    temperature: 0.6,
    top_k: 40,
    top_p: 0.92,
    min_p: 0,
    max_tokens: 1024,
    reasoning_budget: -1,
    reasoning_format: "none",
    enable_thinking: true,
  };
}

export function normalizeRuntimeConfig(config: RuntimeConfig): RuntimeConfig {
  const asNumber = (value: number, fallback: number): number =>
    Number.isFinite(value) ? value : fallback;

  return {
    ...config,
    model_filename: config.model_filename?.trim() || "Bonsai-8B.gguf",
    model_variant: config.model_variant?.trim() || "8B",
    runtime_binary_path: config.runtime_binary_path?.trim() || null,
    model_file_path: config.model_file_path?.trim() || null,
    system_prompt: config.system_prompt?.trim() || "You are a helpful assistant.",
    temperature: asNumber(config.temperature, 0.6),
    top_k: Math.max(1, Math.round(asNumber(config.top_k, 40))),
    top_p: Math.min(1, Math.max(0, asNumber(config.top_p, 0.92))),
    min_p: Math.min(1, Math.max(0, asNumber(config.min_p, 0))),
    max_tokens: Math.max(1, Math.round(asNumber(config.max_tokens, 1024))),
    ctx_size: Math.max(0, Math.round(asNumber(config.ctx_size, 0))),
    gpu_layers: Math.max(0, Math.round(asNumber(config.gpu_layers, 99))),
    threads: Math.max(1, Math.round(asNumber(config.threads, 8))),
    reasoning_budget: Math.round(asNumber(config.reasoning_budget, -1)) === 0 ? 0 : -1,
    reasoning_format: config.reasoning_format?.trim() || "none",
    enable_thinking: Boolean(config.enable_thinking),
  };
}

export function detectRuntimePreset(config: RuntimeConfig): RuntimePreset | "custom" {
  const normalized = normalizeRuntimeConfig(config);

  for (const preset of ["demo", "power", "max"] as const) {
    const candidate = normalizeRuntimeConfig(applyRuntimePreset(preset, normalized));
    if (
      candidate.temperature === normalized.temperature &&
      candidate.top_k === normalized.top_k &&
      candidate.top_p === normalized.top_p &&
      candidate.min_p === normalized.min_p &&
      candidate.max_tokens === normalized.max_tokens &&
      candidate.reasoning_budget === normalized.reasoning_budget &&
      candidate.reasoning_format === normalized.reasoning_format &&
      candidate.enable_thinking === normalized.enable_thinking
    ) {
      return preset;
    }
  }

  return "custom";
}

export function areRuntimeConfigsEqual(left: RuntimeConfig, right: RuntimeConfig): boolean {
  return JSON.stringify(normalizeRuntimeConfig(left)) === JSON.stringify(normalizeRuntimeConfig(right));
}
