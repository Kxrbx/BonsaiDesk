import { useEffect, type ChangeEvent } from "react";
import type { RuntimePreset } from "../lib/runtime-config";
import type { RuntimeConfig, RuntimeStatus } from "../types";

export type RuntimePanelTab = "runtime" | "parameters" | "logs";

interface RuntimePanelProps {
  open: boolean;
  activeTab: RuntimePanelTab;
  runtimeStatus: RuntimeStatus | null;
  runtimeConfig: RuntimeConfig | null;
  activePreset: RuntimePreset | "custom" | null;
  hasUnsavedChanges: boolean;
  logs: string[];
  isBusy: boolean;
  onToggle: () => void;
  onTabChange: (tab: RuntimePanelTab) => void;
  onChange: (nextConfig: RuntimeConfig) => void;
  onApplyPreset: (preset: RuntimePreset) => void;
  onSave: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRefreshLogs: () => void;
}

function field(
  label: string,
  value: string | number,
  onChange: (nextValue: string) => void,
  type = "text",
  multiline = false,
  hint?: string,
  fieldName?: string
) {
  const commonProps = {
    value,
    name: fieldName,
    autoComplete: "off" as const,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    ...(type === "number" && { inputMode: "decimal" as const }),
  };

  return (
    <label className="config-field">
      <span>{label}</span>
      {multiline ? (
        <textarea className="config-field__textarea" rows={5} {...commonProps} />
      ) : (
        <input type={type} {...commonProps} />
      )}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function selectField(
  label: string,
  value: string | number,
  onChange: (nextValue: string) => void,
  options: Array<{ value: string; label: string }>,
  hint?: string,
  fieldName?: string
) {
  return (
    <label className="config-field">
      <span>{label}</span>
      <select name={fieldName} value={String(value)} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function RuntimePanel({
  open,
  activeTab,
  runtimeStatus,
  runtimeConfig,
  activePreset,
  hasUnsavedChanges,
  logs,
  isBusy,
  onToggle,
  onTabChange,
  onChange,
  onApplyPreset,
  onSave,
  onStart,
  onStop,
  onRestart,
  onRefreshLogs,
}: RuntimePanelProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onToggle();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onToggle]);

  if (!open || !runtimeStatus || !runtimeConfig) {
    return null;
  }

  const statusLabel = runtimeStatus.ready ? "Ready" : runtimeStatus.running ? "Booting" : "Stopped";
  const activePresetLabel =
    activePreset === "demo"
      ? "Official Prism demo profile"
      : activePreset === "power"
        ? "Bonsai Desk power profile"
        : activePreset === "max"
          ? "High-output reasoning profile"
          : "Custom tuned profile";

  return (
    <div className="runtime-modal" role="presentation">
      <button className="runtime-modal__backdrop" aria-label="Close runtime settings" onClick={onToggle} />

      <section
        className="runtime-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="runtime-modal-title"
      >
        <header className="runtime-modal__header">
          <div className="runtime-modal__titleblock">
            <p className="eyebrow">Runtime control center</p>
            <h3 id="runtime-modal-title">Prism / Bonsai settings</h3>
            <p>Tune the local runtime, apply presets, and inspect logs without leaving the chat surface.</p>
          </div>

          <div className="runtime-modal__header-actions">
            <span className={`runtime-status-badge ${runtimeStatus.ready ? "runtime-status-badge--ready" : ""}`}>
              {statusLabel}
            </span>
            <button className="ghost-button runtime-modal__close" onClick={onToggle}>
              Close
            </button>
          </div>
        </header>

        <div className="runtime-tabs runtime-tabs--modal">
          <button
            className={`runtime-tab ${activeTab === "runtime" ? "runtime-tab--active" : ""}`}
            onClick={() => onTabChange("runtime")}
          >
            Runtime
          </button>
          <button
            className={`runtime-tab ${activeTab === "parameters" ? "runtime-tab--active" : ""}`}
            onClick={() => onTabChange("parameters")}
          >
            Parameters
          </button>
          <button
            className={`runtime-tab ${activeTab === "logs" ? "runtime-tab--active" : ""}`}
            onClick={() => onTabChange("logs")}
          >
            Logs
          </button>
        </div>

        <div className="runtime-modal__body">
          {activeTab === "runtime" ? (
            <div className="runtime-modal__panel">
              <section className="runtime-hero-card">
                <div className="runtime-hero-card__copy">
                  <span className="runtime-hero-card__kicker">Live runtime</span>
                  <h4>{runtimeStatus.ready ? "Your local Bonsai stack is ready." : "Control the local Prism runtime."}</h4>
                  <p>Start, stop, or restart `llama-server`, then inspect the active endpoint, binary, and loaded model.</p>
                </div>
                <div className="runtime-actions runtime-actions--hero">
                  <button className="primary-button" disabled={isBusy} onClick={onStart}>
                    Start runtime
                  </button>
                  <button className="ghost-button" disabled={isBusy} onClick={onRestart}>
                    Restart
                  </button>
                  <button className="ghost-button" disabled={isBusy} onClick={onStop}>
                    Stop
                  </button>
                </div>
              </section>

              <section className="runtime-summary-grid">
                <article className="runtime-summary-card">
                  <span>Status</span>
                  <strong>{statusLabel}</strong>
                  <p>{runtimeStatus.health_url}</p>
                </article>
                <article className="runtime-summary-card">
                  <span>Model</span>
                  <strong>{runtimeConfig.model_filename}</strong>
                  <p>{runtimeStatus.model_path ?? "No model path detected yet."}</p>
                </article>
                <article className="runtime-summary-card">
                  <span>Binary</span>
                  <strong>{runtimeStatus.runtime_source ?? "Local runtime"}</strong>
                  <p>{runtimeStatus.binary_path ?? "No runtime binary detected yet."}</p>
                </article>
                <article className="runtime-summary-card">
                  <span>Profile</span>
                  <strong>{activePreset === "custom" ? "Custom" : activePresetLabel}</strong>
                  <p>{hasUnsavedChanges ? "Unsaved local changes" : "Saved and active"}</p>
                </article>
              </section>

              <section className="runtime-detail-grid">
                <article className="runtime-card">
                  <div className="runtime-card__top">
                    <h4>Runtime identity</h4>
                  </div>
                  <div className="runtime-stat-list">
                    <div className="runtime-stat">
                      <span>Endpoint</span>
                      <strong>{runtimeStatus.health_url}</strong>
                    </div>
                    <div className="runtime-stat">
                      <span>PID</span>
                      <strong>{runtimeStatus.pid ?? "Not running"}</strong>
                    </div>
                    <div className="runtime-stat">
                      <span>Install status</span>
                      <strong>{runtimeStatus.installed ? "Installed" : "Not installed"}</strong>
                    </div>
                    <div className="runtime-stat">
                      <span>Last note</span>
                      <strong>{runtimeStatus.last_error ?? runtimeStatus.install_message ?? "No issues reported"}</strong>
                    </div>
                  </div>
                </article>

                <article className="runtime-card">
                  <div className="runtime-card__top">
                    <h4>Active defaults</h4>
                  </div>
                  <div className="runtime-stat-list">
                    <div className="runtime-stat">
                      <span>Sampling</span>
                      <strong>Temp {runtimeConfig.temperature} | Top-k {runtimeConfig.top_k} | Top-p {runtimeConfig.top_p}</strong>
                    </div>
                    <div className="runtime-stat">
                      <span>Output</span>
                      <strong>Max {runtimeConfig.max_tokens} tokens | Min-p {runtimeConfig.min_p}</strong>
                    </div>
                    <div className="runtime-stat">
                      <span>Runtime</span>
                      <strong>Context {runtimeConfig.ctx_size || "Auto"} | GPU {runtimeConfig.gpu_layers} | Threads {runtimeConfig.threads}</strong>
                    </div>
                    <div className="runtime-stat">
                      <span>Reasoning</span>
                      <strong>{runtimeConfig.enable_thinking ? "Thinking enabled" : "Thinking disabled"} | Budget {runtimeConfig.reasoning_budget}</strong>
                    </div>
                  </div>
                </article>
              </section>
            </div>
          ) : null}

          {activeTab === "parameters" ? (
            <div className="runtime-modal__panel runtime-modal__panel--scroll">
              <section className="runtime-preset-strip">
                <div className="runtime-preset-strip__copy">
                  <span className="runtime-hero-card__kicker">Presets</span>
                  <h4>Start from an opinionated profile.</h4>
                  <p>
                    The launcher now defaults to a stronger "Power" profile. This Prism runtime only accepts reasoning
                    budget values of 0 or -1.
                  </p>
                </div>

                <div className="runtime-preset-status">
                  <span className={`runtime-preset-status__badge ${activePreset === "custom" ? "runtime-preset-status__badge--custom" : ""}`}>
                    {activePreset === "custom" ? "Custom profile" : activePresetLabel}
                  </span>
                  <p>
                    {hasUnsavedChanges
                      ? "Preset changes are applied locally. Save defaults to persist them."
                      : "Saved settings already match the active profile."}
                  </p>
                </div>

                <div className="runtime-preset-grid">
                  <button
                    className={`runtime-preset ${activePreset === "demo" ? "runtime-preset--active" : ""}`}
                    onClick={() => onApplyPreset("demo")}
                  >
                    <strong>Demo</strong>
                    <span>Official Prism demo behavior, lower latency, thinking disabled.</span>
                    <em>{activePreset === "demo" ? "Current preset" : "Apply preset"}</em>
                  </button>
                  <button
                    className={`runtime-preset runtime-preset--featured ${activePreset === "power" ? "runtime-preset--active" : ""}`}
                    onClick={() => onApplyPreset("power")}
                  >
                    <strong>Power</strong>
                    <span>Stronger default with longer outputs and unrestricted thinking enabled.</span>
                    <em>{activePreset === "power" ? "Current preset" : "Apply preset"}</em>
                  </button>
                  <button
                    className={`runtime-preset ${activePreset === "max" ? "runtime-preset--active" : ""}`}
                    onClick={() => onApplyPreset("max")}
                  >
                    <strong>Max</strong>
                    <span>Larger generations with the same unrestricted thinking budget.</span>
                    <em>{activePreset === "max" ? "Current preset" : "Apply preset"}</em>
                  </button>
                </div>
              </section>

              <div className="config-grid">
                <section className="config-section config-section--wide">
                  <div className="config-section__header">
                    <strong>Prompting</strong>
                    <span>Applied to new chats immediately.</span>
                  </div>
                  {field(
                    "System prompt",
                    runtimeConfig.system_prompt,
                    (next) => onChange({ ...runtimeConfig, system_prompt: next }),
                    "text",
                    true,
                    undefined,
                    "system_prompt",
                  )}
                </section>

                <section className="config-section">
                  <div className="config-section__header">
                    <strong>Sampling</strong>
                    <span>Preset buttons update these values immediately in the form.</span>
                  </div>
                  <div className="config-grid config-grid--compact">
                    {field("Temperature", runtimeConfig.temperature, (next) => onChange({ ...runtimeConfig, temperature: Number(next) }), "number", false, undefined, "temperature")}
                    {field("Top-k", runtimeConfig.top_k, (next) => onChange({ ...runtimeConfig, top_k: Number(next) }), "number", false, undefined, "top_k")}
                    {field("Top-p", runtimeConfig.top_p, (next) => onChange({ ...runtimeConfig, top_p: Number(next) }), "number", false, undefined, "top_p")}
                    {field("Min-p", runtimeConfig.min_p, (next) => onChange({ ...runtimeConfig, min_p: Number(next) }), "number", false, undefined, "min_p")}
                    {field("Max tokens", runtimeConfig.max_tokens, (next) => onChange({ ...runtimeConfig, max_tokens: Number(next) }), "number", false, undefined, "max_tokens")}
                  </div>
                </section>

                <section className="config-section">
                  <div className="config-section__header">
                    <strong>Runtime</strong>
                    <span>Used when the local server starts or restarts.</span>
                  </div>
                  <div className="config-grid config-grid--compact">
                    {field("Model filename", runtimeConfig.model_filename, (next) => onChange({ ...runtimeConfig, model_filename: next }), "text", false, undefined, "model_filename")}
                    {field(
                      "Context",
                      runtimeConfig.ctx_size,
                      (next) => onChange({ ...runtimeConfig, ctx_size: Number(next) }),
                      "number",
                      false,
                      "0 keeps Prism auto-fit enabled",
                      "ctx_size",
                    )}
                    {field("GPU layers", runtimeConfig.gpu_layers, (next) => onChange({ ...runtimeConfig, gpu_layers: Number(next) }), "number", false, undefined, "gpu_layers")}
                    {field("Threads", runtimeConfig.threads, (next) => onChange({ ...runtimeConfig, threads: Number(next) }), "number", false, undefined, "threads")}
                  </div>
                </section>

                <section className="config-section">
                  <div className="config-section__header">
                    <strong>Reasoning</strong>
                    <span>Saved between sessions and applied on runtime restart.</span>
                  </div>
                  <div className="config-grid config-grid--compact">
                    {selectField(
                      "Reasoning budget",
                      runtimeConfig.reasoning_budget,
                      (next) => onChange({ ...runtimeConfig, reasoning_budget: Number(next) }),
                      [
                        { value: "-1", label: "Unrestricted (-1)" },
                        { value: "0", label: "Disabled (0)" },
                      ],
                      "Current Prism runtime only supports -1 or 0 for this flag.",
                      "reasoning_budget",
                    )}
                    {field("Reasoning format", runtimeConfig.reasoning_format, (next) => onChange({ ...runtimeConfig, reasoning_format: next }), "text", false, undefined, "reasoning_format")}
                  </div>
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={runtimeConfig.enable_thinking}
                      onChange={(event) => onChange({ ...runtimeConfig, enable_thinking: event.target.checked })}
                    />
                    <div>
                      <strong>Enable thinking</strong>
                      <span>Sets Prism chat-template kwargs for reasoning-enabled responses.</span>
                    </div>
                  </label>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "logs" ? (
            <div className="runtime-modal__panel">
              <article className="runtime-card runtime-card--logs runtime-card--logs-modal">
                <div className="runtime-card__top">
                  <div>
                    <h4>Runtime logs</h4>
                    <span>Inspect startup, health, and crash output from `llama-server`.</span>
                  </div>
                  <button className="ghost-button" onClick={onRefreshLogs}>
                    Refresh
                  </button>
                </div>
                <pre>{logs.length ? logs.join("\n") : "No runtime logs yet."}</pre>
              </article>
            </div>
          ) : null}
        </div>

        {activeTab === "parameters" ? (
          <footer className="runtime-modal__footer">
            <p>
              {hasUnsavedChanges
                ? "You have unsaved runtime changes. Save defaults to persist them across sessions."
                : "Saved settings are in sync. Restart the runtime after major reasoning changes."}
            </p>
            <div className="runtime-modal__footer-actions">
              <button className="ghost-button" disabled={isBusy} onClick={onRestart}>
                Restart runtime
              </button>
              <button className="primary-button" disabled={isBusy} onClick={onSave}>
                Save defaults
              </button>
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
