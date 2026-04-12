import { useEffect, useMemo, useState } from "react";
import type {
  AssetSourceInfo,
  InstallProgress,
  ModelDescriptor,
  RuntimeConfig,
  RuntimeDiagnostics,
  RuntimeStatus,
} from "../types";

interface SetupScreenProps {
  runtimeStatus: RuntimeStatus | null;
  runtimeConfig: RuntimeConfig | null;
  installProgress: InstallProgress | null;
  models: ModelDescriptor[];
  sources: AssetSourceInfo[];
  diagnostics: RuntimeDiagnostics | null;
  isInstalling: boolean;
  isBusy: boolean;
  error: string | null;
  onInstall: () => void;
  onStart: () => void;
  onSelectModelVariant: (variant: string) => void;
  onInstallModelVariant: (variant: string) => void;
  onBrowseRuntimeBinary: () => Promise<string | null>;
  onBrowseModelFile: () => Promise<string | null>;
  onUseExistingAssets: (payload: {
    runtime_binary_path?: string | null;
    model_file_path?: string | null;
  }) => void;
}

function percent(value: number | undefined): string {
  return `${Math.max(0, Math.min(100, Math.round(value ?? 0)))}%`;
}

function sourceBadge(source: string | null | undefined): string {
  switch (source) {
    case "linked-local":
      return "Linked locally";
    case "managed-download":
    case "managed-runtime":
      return "Managed by Bonsai Desk";
    case "env-override":
      return "Environment override";
    case "system-path":
      return "Detected on PATH";
    default:
      return "Not configured";
  }
}

export function SetupScreen({
  runtimeStatus,
  runtimeConfig,
  installProgress,
  models,
  sources,
  diagnostics,
  isInstalling,
  isBusy,
  error,
  onInstall,
  onStart,
  onSelectModelVariant,
  onInstallModelVariant,
  onBrowseRuntimeBinary,
  onBrowseModelFile,
  onUseExistingAssets,
}: SetupScreenProps) {
  const [runtimePathDraft, setRuntimePathDraft] = useState(
    runtimeConfig?.runtime_binary_path ?? runtimeStatus?.binary_path ?? "",
  );
  const [modelPathDraft, setModelPathDraft] = useState(
    runtimeConfig?.model_file_path ?? runtimeStatus?.model_path ?? "",
  );
  const [browseBusy, setBrowseBusy] = useState<"runtime" | "model" | null>(null);
  const [understandsOfficialDownload, setUnderstandsOfficialDownload] = useState(false);

  useEffect(() => {
    setRuntimePathDraft(runtimeConfig?.runtime_binary_path ?? runtimeStatus?.binary_path ?? "");
  }, [runtimeConfig?.runtime_binary_path, runtimeStatus?.binary_path]);

  useEffect(() => {
    setModelPathDraft(runtimeConfig?.model_file_path ?? runtimeStatus?.model_path ?? "");
  }, [runtimeConfig?.model_file_path, runtimeStatus?.model_path]);

  useEffect(() => {
    try {
      setUnderstandsOfficialDownload(window.localStorage.getItem("bonsai-desk-install-ack") === "true");
    } catch {
      setUnderstandsOfficialDownload(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("bonsai-desk-install-ack", understandsOfficialDownload ? "true" : "false");
    } catch {
      // Ignore localStorage failures and keep the checkbox functional for this session.
    }
  }, [understandsOfficialDownload]);

  const stages = installProgress?.stages ?? [];
  const runtimeStageProgress =
    stages
      .filter((stage) => stage.id === "runtime_package" || stage.id === "runtime_extract")
      .reduce((sum, stage) => sum + stage.progress, 0) / 2 || 0;
  const modelStage = stages.find((stage) => stage.id === "model_download");
  const runtimeSources = useMemo(() => sources.filter((item) => item.kind === "runtime"), [sources]);
  const modelSources = useMemo(() => sources.filter((item) => item.kind === "model"), [sources]);

  async function handleBrowseRuntime() {
    try {
      setBrowseBusy("runtime");
      const path = await onBrowseRuntimeBinary();
      if (path) {
        setRuntimePathDraft(path);
      }
    } finally {
      setBrowseBusy(null);
    }
  }

  async function handleBrowseModel() {
    try {
      setBrowseBusy("model");
      const path = await onBrowseModelFile();
      if (path) {
        setModelPathDraft(path);
      }
    } finally {
      setBrowseBusy(null);
    }
  }

  return (
    <main className="setup-screen">
      <section className="setup-hero setup-hero--dense">
        <div className="setup-hero__copy">
          <p className="eyebrow">Windows-local Bonsai deployment</p>
          <h1>Choose the Bonsai model, inspect diagnostics, then start the local Prism runtime.</h1>
          <p>
            Download official upstream assets with transparent licensing, or link files already present on this
            machine without copying them into the app.
          </p>
        </div>

        <div className="setup-hero__summary">
          <span className={`setup-badge ${runtimeStatus?.installed ? "setup-badge--good" : ""}`}>
            {runtimeStatus?.installed ? "Runtime + model available" : "Setup required"}
          </span>
          <span className={`setup-badge ${runtimeStatus?.ready ? "setup-badge--good" : ""}`}>
            {runtimeStatus?.ready ? "Runtime ready" : runtimeStatus?.running ? "Runtime booting" : "Runtime stopped"}
          </span>
          <span className="setup-badge">{sourceBadge(runtimeStatus?.runtime_source)}</span>
          <span className="setup-badge">{sourceBadge(runtimeStatus?.model_source)}</span>
        </div>

        <div className="setup-flow-grid">
          <article className="setup-flow-card setup-flow-card--download">
            <div className="setup-flow-card__header">
              <div>
                <p className="eyebrow">Official flow</p>
                <h2>Download Prism runtime + selected Bonsai model</h2>
              </div>
              <span className="setup-flow-card__tag">Best for first install</span>
            </div>

            <div className="setup-transparency-card">
              <div className="setup-transparency-card__header">
                <strong>Transparency notice</strong>
                <span>Required before official download</span>
              </div>
              <ul className="setup-transparency-list">
                <li>Bonsai Desk downloads runtime and model files from official upstream sources.</li>
                <li>Downloaded files stay under their upstream licenses and terms.</li>
                <li>Bonsai Desk does not re-host, bundle, or claim ownership of those upstream assets.</li>
              </ul>
              <label className="setup-acknowledge">
                <input
                  type="checkbox"
                  checked={understandsOfficialDownload}
                  onChange={(event) => setUnderstandsOfficialDownload(event.target.checked)}
                />
                <span>I understand that official downloads come from upstream Prism/Bonsai sources and stay under their licenses.</span>
              </label>
            </div>

            <div className="setup-actions">
              <button className="primary-button" disabled={isInstalling || isBusy || !understandsOfficialDownload} onClick={onInstall}>
                {isInstalling ? "Installing in background..." : "Download selected official assets"}
              </button>
              <button className="ghost-button" disabled={isInstalling || isBusy || !runtimeStatus?.installed} onClick={onStart}>
                Start runtime
              </button>
            </div>

            <div className="setup-progress" aria-live="polite" aria-atomic="true">
              <div className="setup-progress__header">
                <div>
                  <h2>Download progress</h2>
                  <p>{installProgress?.current_step ?? "Waiting for install to start."}</p>
                </div>
                <strong>{percent(installProgress?.overall_progress)}</strong>
              </div>

              <div className="progress-bar progress-bar--large">
                <div
                  className={`progress-bar__fill ${installProgress?.state === "error" ? "progress-bar__fill--error" : ""}`}
                  style={{ width: percent(installProgress?.overall_progress) }}
                />
              </div>

              <div className="setup-progress__cards">
                <article className="setup-progress-card">
                  <header>
                    <strong>Runtime package</strong>
                    <span>{percent(runtimeStageProgress)}</span>
                  </header>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: percent(runtimeStageProgress) }} />
                  </div>
                  <p>
                    {stages.find((stage) => stage.id === "runtime_extract")?.detail ??
                      stages.find((stage) => stage.id === "runtime_package")?.detail ??
                      "Waiting to download or detect llama-server."}
                  </p>
                </article>

                <article className="setup-progress-card">
                  <header>
                    <strong>Bonsai model</strong>
                    <span>{percent(modelStage?.progress)}</span>
                  </header>
                  <div className="progress-bar">
                    <div className="progress-bar__fill progress-bar__fill--mint" style={{ width: percent(modelStage?.progress) }} />
                  </div>
                  <p>{modelStage?.detail ?? "Waiting to download the selected Bonsai GGUF model."}</p>
                </article>
              </div>
            </div>
          </article>

          <article className="setup-flow-card setup-flow-card--link">
            <div className="setup-flow-card__header">
              <div>
                <p className="eyebrow">Existing files</p>
                <h2>Use assets already on this PC</h2>
              </div>
              <span className="setup-flow-card__tag">Instant relink</span>
            </div>

            <div className="setup-inline-note">
              Bonsai Desk stores only the paths you select here. It does not duplicate or republish those files.
            </div>

            <div className="setup-link-grid">
              <section className="setup-link-card">
                <div className="setup-link-card__header">
                  <strong>Runtime binary</strong>
                  <span>{sourceBadge(runtimeStatus?.runtime_source)}</span>
                </div>
                <label className="config-field">
                  <span>Path to llama-server.exe</span>
                  <input
                    name="runtime_binary_path"
                    value={runtimePathDraft}
                    onChange={(event) => setRuntimePathDraft(event.target.value)}
                    placeholder="C:\\path\\to\\llama-server.exe"
                    autoComplete="off"
                  />
                </label>
                <div className="setup-actions">
                  <button className="ghost-button" disabled={isBusy || browseBusy !== null} onClick={() => void handleBrowseRuntime()}>
                    {browseBusy === "runtime" ? "Opening picker..." : "Browse..."}
                  </button>
                  <button
                    className="primary-button"
                    disabled={isBusy || !runtimePathDraft.trim()}
                    onClick={() => onUseExistingAssets({ runtime_binary_path: runtimePathDraft })}
                  >
                    Use this runtime
                  </button>
                  <button
                    className="ghost-button"
                    disabled={isBusy || !runtimeConfig?.runtime_binary_path}
                    onClick={() => {
                      setRuntimePathDraft("");
                      onUseExistingAssets({ runtime_binary_path: "" });
                    }}
                  >
                    Clear link
                  </button>
                </div>
              </section>

              <section className="setup-link-card">
                <div className="setup-link-card__header">
                  <strong>Model file</strong>
                  <span>{sourceBadge(runtimeStatus?.model_source)}</span>
                </div>
                <label className="config-field">
                  <span>Path to .gguf model</span>
                  <input
                    name="model_file_path"
                    value={modelPathDraft}
                    onChange={(event) => setModelPathDraft(event.target.value)}
                    placeholder="D:\\Models\\Bonsai-8B.gguf"
                    autoComplete="off"
                  />
                </label>
                <div className="setup-actions">
                  <button className="ghost-button" disabled={isBusy || browseBusy !== null} onClick={() => void handleBrowseModel()}>
                    {browseBusy === "model" ? "Opening picker..." : "Browse..."}
                  </button>
                  <button
                    className="primary-button"
                    disabled={isBusy || !modelPathDraft.trim()}
                    onClick={() => onUseExistingAssets({ model_file_path: modelPathDraft })}
                  >
                    Use this model
                  </button>
                  <button
                    className="ghost-button"
                    disabled={isBusy || !runtimeConfig?.model_file_path}
                    onClick={() => {
                      setModelPathDraft("");
                      onUseExistingAssets({ model_file_path: "" });
                    }}
                  >
                    Clear link
                  </button>
                </div>
              </section>
            </div>
          </article>
        </div>

        {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
        {installProgress?.error ? <div className="notice notice--error" role="alert">{installProgress.error}</div> : null}
        {runtimeStatus?.install_message ? <div className="notice" role="status">{runtimeStatus.install_message}</div> : null}
      </section>

      <section className="setup-grid setup-grid--wide">
        <article className="setup-card setup-card--metrics">
          <h2>Bonsai model variants</h2>
          <div className="setup-model-list">
            {models.map((model) => (
              <div key={model.variant} className={`setup-model-row ${model.is_active ? "setup-model-row--active" : ""}`}>
                <div className="setup-model-row__copy">
                  <strong>{model.name}</strong>
                  <span>{model.filename} | {model.size_hint}</span>
                  <span>{model.requirements_hint}</span>
                  <span>{model.is_active ? "Active" : "Inactive"} | {model.is_downloaded ? "Downloaded" : "Not downloaded"}</span>
                </div>
                <div className="setup-model-row__actions">
                  <button className="ghost-button" disabled={isBusy || model.is_active} onClick={() => onSelectModelVariant(model.variant)}>
                    {model.is_active ? "Selected" : "Select"}
                  </button>
                  <button
                    className="primary-button"
                    disabled={isBusy || isInstalling || model.is_downloaded}
                    onClick={() => onInstallModelVariant(model.variant)}
                  >
                    {model.is_downloaded ? "Downloaded" : "Install model"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="setup-card">
          <h2>Diagnostics</h2>
          <div className="setup-diagnostics-meta">
            <span>{diagnostics?.platform_label ?? "Platform unknown"}</span>
            <span>{diagnostics?.gpu_label ?? "GPU unknown"}</span>
            <span>{diagnostics?.cuda_label ?? "CUDA unknown"}</span>
            <span>{diagnostics?.runtime_version ?? "Runtime version unknown"}</span>
          </div>
          {(diagnostics?.checks ?? []).map((check) => (
            <div key={check.id} className={`setup-diagnostic-row setup-diagnostic-row--${check.status}`}>
              <div className="setup-diagnostic-row__top">
                <strong>{check.label}</strong>
                <span>{check.status.toUpperCase()}</span>
              </div>
              <p>{check.detail}</p>
              {check.action_hint ? <small>{check.action_hint}</small> : null}
            </div>
          ))}
        </article>

        <article className="setup-card">
          <h2>Current files</h2>
          <div className="setup-card__row">
            <strong>Runtime</strong>
            <span>{runtimeStatus?.binary_path ?? "No runtime selected yet"}</span>
          </div>
          <div className="setup-card__row">
            <strong>Model</strong>
            <span>{runtimeStatus?.model_path ?? "No model selected yet"}</span>
          </div>
          <div className="setup-card__row">
            <strong>Runtime source</strong>
            <span>{sourceBadge(runtimeStatus?.runtime_source)}</span>
          </div>
          <div className="setup-card__row">
            <strong>Model source</strong>
            <span>{sourceBadge(runtimeStatus?.model_source)}</span>
          </div>
        </article>

        <article className="setup-card">
          <h2>Sources & licenses</h2>
          {[...runtimeSources, ...modelSources].map((source) => (
            <div key={source.id} className="setup-card__row">
              <strong>{source.title}</strong>
              <span>{source.license_name}</span>
              <span>{source.summary}</span>
              <a className="setup-link" href={source.source_url} target="_blank" rel="noreferrer">
                Open official source
              </a>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
