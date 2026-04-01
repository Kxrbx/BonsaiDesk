import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api } from "./api/client";
import { Composer } from "./components/Composer";
import { MessageList } from "./components/MessageList";
import { RuntimePanel, type RuntimePanelTab } from "./components/RuntimePanel";
import { Sidebar } from "./components/Sidebar";
import {
  applyRuntimePreset,
  areRuntimeConfigsEqual,
  detectRuntimePreset,
  normalizeRuntimeConfig,
  type RuntimePreset,
} from "./lib/runtime-config";
import { loadUiPrefs, saveUiPrefs } from "./lib/ui-prefs";
import { SetupScreen } from "./pages/SetupScreen";
import type {
  AssetSourceInfo,
  Conversation,
  ConversationSummary,
  InstallProgress,
  Message,
  ModelDescriptor,
  RuntimeConfig,
  RuntimeStatus
} from "./types";

function isMissingConversationError(caughtError: unknown): boolean {
  return caughtError instanceof ApiError && caughtError.status === 404 && caughtError.detail === "Conversation not found.";
}

export default function App() {
  const initialUiPrefs = useMemo(() => loadUiPrefs(), []);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);
  const [installProgress, setInstallProgress] = useState<InstallProgress | null>(null);
  const [assetSources, setAssetSources] = useState<AssetSourceInfo[]>([]);
  const [models, setModels] = useState<ModelDescriptor[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showRuntimePanel, setShowRuntimePanel] = useState(initialUiPrefs.showRuntimePanel);
  const [runtimePanelTab, setRuntimePanelTab] = useState<RuntimePanelTab>(initialUiPrefs.runtimeTab);
  const abortRef = useRef<AbortController | null>(null);

  const visibleMessages = useMemo<Message[]>(() => {
    return selectedConversation?.messages ?? [];
  }, [selectedConversation]);

  const activePreset = useMemo<RuntimePreset | "custom" | null>(() => {
    return runtimeConfig ? detectRuntimePreset(runtimeConfig) : null;
  }, [runtimeConfig]);

  const hasUnsavedRuntimeChanges = useMemo(() => {
    if (!runtimeConfig || !runtimeStatus) {
      return false;
    }
    return !areRuntimeConfigsEqual(runtimeConfig, runtimeStatus.config);
  }, [runtimeConfig, runtimeStatus]);

  async function refreshRuntime() {
    const overview = await api.getRuntimeOverview();
    setRuntimeStatus(overview.status);
    setRuntimeConfig(overview.config);
    setModels(overview.models);
    setInstallProgress(overview.install_progress);
    setAssetSources(overview.sources);
    setIsInstalling(overview.install_progress.state === "running");
  }

  async function refreshConversations(selectConversationId?: string | null) {
    const items = await api.listConversations();
    setConversations(items);
    const requestedId = selectConversationId ?? selectedConversation?.id ?? items[0]?.id ?? null;
    const nextId = requestedId && items.some((item) => item.id === requestedId) ? requestedId : items[0]?.id ?? null;
    if (nextId) {
      try {
        const conversation = await api.getConversation(nextId);
        setSelectedConversation(conversation);
      } catch (caughtError) {
        if (isMissingConversationError(caughtError)) {
          setSelectedConversation(null);
          return;
        }
        throw caughtError;
      }
    } else {
      setSelectedConversation(null);
    }
  }

  async function bootstrap() {
    try {
      setError(null);
      await Promise.all([refreshRuntime(), refreshConversations()]);
      setLogs(await api.getRuntimeLogs());
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsHydrating(false);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    saveUiPrefs({
      showRuntimePanel,
      runtimeTab: runtimePanelTab,
    });
  }, [showRuntimePanel, runtimePanelTab]);

  useEffect(() => {
    document.body.style.overflow = showRuntimePanel ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showRuntimePanel]);

  useEffect(() => {
    if (!isInstalling) {
      return;
    }

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const overview = await api.getRuntimeOverview();
          setInstallProgress(overview.install_progress);
          setRuntimeStatus(overview.status);
          setRuntimeConfig(overview.config);
          setModels(overview.models);
          setAssetSources(overview.sources);

          if (overview.install_progress.state === "completed" || overview.install_progress.state === "error") {
            setIsInstalling(false);
            await refreshRuntime();
          }
        } catch (caughtError) {
          setError((caughtError as Error).message);
          setIsInstalling(false);
        }
      })();
    }, 900);

    return () => window.clearInterval(interval);
  }, [isInstalling]);

  async function handleCreateConversation() {
    try {
      const conversation = await api.createConversation();
      await refreshConversations(conversation.id);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    }
  }

  async function handleSelectConversation(conversationId: string) {
    try {
      setError(null);
      setSelectedConversation(await api.getConversation(conversationId));
    } catch (caughtError) {
      if (isMissingConversationError(caughtError)) {
        setSelectedConversation(null);
        await refreshConversations(null);
        return;
      }
      setError((caughtError as Error).message);
    }
  }

  async function handleRenameConversation(conversationId: string) {
    const current = conversations.find((item) => item.id === conversationId);
    const title = window.prompt("Conversation title", current?.title ?? "");
    if (!title) {
      return;
    }
    try {
      await api.renameConversation(conversationId, title);
      await refreshConversations(conversationId);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    if (!window.confirm("Delete this conversation?")) {
      return;
    }
    try {
      await api.deleteConversation(conversationId);
      const nextFallback = selectedConversation?.id === conversationId ? null : selectedConversation?.id;
      await refreshConversations(nextFallback);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    }
  }

  async function handleInstall() {
    try {
      setError(null);
      const progress = await api.installRuntime();
      setInstallProgress(progress);
      setIsInstalling(progress.state === "running");
      if (progress.state === "completed") {
        await refreshRuntime();
      }
    } catch (caughtError) {
      setError((caughtError as Error).message);
      setIsInstalling(false);
    }
  }

  async function handleStart() {
    try {
      setError(null);
      setIsBusy(true);
      setRuntimeStatus(await api.startRuntime());
      setLogs(await api.getRuntimeLogs());
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleBrowseRuntimeBinary(): Promise<string | null> {
    const result = await api.browseRuntimeBinary();
    return result.path;
  }

  async function handleBrowseModelFile(): Promise<string | null> {
    const result = await api.browseModelFile();
    return result.path;
  }

  async function handleUseExistingAssets(payload: {
    runtime_binary_path?: string | null;
    model_file_path?: string | null;
  }) {
    try {
      setError(null);
      setIsBusy(true);
      const overview = await api.useExistingAssets(payload);
      setRuntimeStatus(overview.status);
      setRuntimeConfig(overview.config);
      setModels(overview.models);
      setInstallProgress(overview.install_progress);
      setAssetSources(overview.sources);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStop() {
    try {
      setError(null);
      setIsBusy(true);
      setRuntimeStatus(await api.stopRuntime());
      setLogs(await api.getRuntimeLogs());
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRestart() {
    try {
      setError(null);
      setIsBusy(true);
      setRuntimeStatus(await api.restartRuntime());
      setLogs(await api.getRuntimeLogs());
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveConfig() {
    if (!runtimeConfig) {
      return;
    }
    try {
      setError(null);
      setIsBusy(true);
      const saved = await api.updateRuntimeConfig(normalizeRuntimeConfig(runtimeConfig));
      setRuntimeConfig(saved);
      await refreshRuntime();
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  function handleApplyPreset(preset: RuntimePreset) {
    if (!runtimeConfig) {
      return;
    }
    setError(null);
    setRuntimeConfig(applyRuntimePreset(preset, runtimeConfig));
    setRuntimePanelTab("parameters");
  }

  function handleStopGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSending(false);
    setStreamingText("");
  }

  async function handleSend() {
    if (!draft.trim() || isSending) {
      return;
    }

    let streamedConversationId = selectedConversation?.id ?? null;
    try {
      setError(null);
      setIsSending(true);
      setStreamingText("");

      if (runtimeStatus?.installed && !runtimeStatus.ready) {
        setRuntimeStatus(await api.startRuntime());
      }

      const content = draft;
      setDraft("");
      const controller = new AbortController();
      abortRef.current = controller;

      await api.streamChat(
        {
          conversation_id: selectedConversation?.id ?? undefined,
          content,
          override_system_prompt: runtimeConfig?.system_prompt,
          override_temperature: runtimeConfig?.temperature,
          override_top_k: runtimeConfig?.top_k,
          override_top_p: runtimeConfig?.top_p,
          override_min_p: runtimeConfig?.min_p,
          override_max_tokens: runtimeConfig?.max_tokens
        },
        (event) => {
          if (event.type === "meta" && event.conversation_id) {
            streamedConversationId = event.conversation_id;
          }
          if (event.type === "delta") {
            setStreamingText((previous) => previous + (event.delta ?? ""));
          }
          if (event.type === "error") {
            setError(event.error ?? "Streaming failed.");
          }
        },
        controller.signal
      );

      await refreshConversations(streamedConversationId);
      setStreamingText("");
      setRuntimeStatus(await api.getRuntimeStatus());
    } catch (caughtError) {
      if ((caughtError as Error).name !== "AbortError") {
        setError((caughtError as Error).message);
        if (streamedConversationId) {
          try {
            await refreshConversations(streamedConversationId);
          } catch {
            // Keep the original streaming error as the primary failure shown to the user.
          }
        }
      }
    } finally {
      abortRef.current = null;
      setIsSending(false);
      setStreamingText("");
    }
  }

  if (isHydrating) {
    return (
      <main className="setup-screen">
        <section className="setup-hero">
          <p className="eyebrow">Bonsai Desk</p>
          <h1>Loading local runtime state...</h1>
          <p>Checking the installed model, runtime binary and saved conversations before opening the app.</p>
        </section>
      </main>
    );
  }

  if (!runtimeStatus || !runtimeConfig) {
    return (
      <main className="setup-screen">
        <section className="setup-hero">
          <p className="eyebrow">Bonsai Desk</p>
          <h1>Backend not reachable.</h1>
          <p>
            The frontend could not load the local backend state. Start the backend first, then reload the page.
          </p>
          {error ? <div className="notice notice--error">{error}</div> : null}
        </section>
      </main>
    );
  }

  const setupMode = runtimeStatus ? !runtimeStatus.installed : false;

  if (setupMode) {
    return (
      <SetupScreen
        runtimeStatus={runtimeStatus}
        runtimeConfig={runtimeConfig}
        installProgress={installProgress}
        models={models}
        sources={assetSources}
        isInstalling={isInstalling}
        isBusy={isBusy}
        error={error}
        onInstall={() => void handleInstall()}
        onStart={() => void handleStart()}
        onBrowseRuntimeBinary={handleBrowseRuntimeBinary}
        onBrowseModelFile={handleBrowseModelFile}
        onUseExistingAssets={(payload) => void handleUseExistingAssets(payload)}
      />
    );
  }

  return (
    <div className={`shell ${showRuntimePanel ? "shell--modal-open" : ""}`}>
      <div className="shell__glow shell__glow--amber" />
      <div className="shell__glow shell__glow--mint" />

      <Sidebar
        conversations={conversations}
        selectedConversationId={selectedConversation?.id ?? null}
        onSelect={(conversationId) => void handleSelectConversation(conversationId)}
        onCreate={() => void handleCreateConversation()}
        onRename={(conversationId) => void handleRenameConversation(conversationId)}
        onDelete={(conversationId) => void handleDeleteConversation(conversationId)}
      />

      <main className="chat-layout">
        <header className="chat-layout__header">
          <div className="chat-layout__header-inner">
            <div className="chat-layout__title-block">
              <p className="eyebrow">
                {runtimeStatus?.ready ? "Runtime ready" : runtimeStatus?.running ? "Runtime booting" : "Runtime stopped"}
              </p>
              <h2>{selectedConversation?.title ?? "New conversation"}</h2>
            </div>
            <div className="status-pills">
              <span className={`pill ${runtimeStatus?.ready ? "pill--ready" : ""}`}>
                {runtimeStatus?.health_url ?? "No endpoint"}
              </span>
              <span className="pill">Model {runtimeConfig?.model_filename ?? "Bonsai-8B.gguf"}</span>
              <button className="ghost-button chat-layout__panel-toggle" onClick={() => setShowRuntimePanel((previous) => !previous)}>
                {showRuntimePanel ? "Close settings" : "Runtime settings"}
              </button>
            </div>
          </div>
        </header>

        {error ? <div className="notice notice--error">{error}</div> : null}

        <div className="chat-scroll-area">
          <MessageList messages={visibleMessages} streamingText={streamingText} isSending={isSending} />
        </div>

        <Composer
          draft={draft}
          disabled={isBusy || isInstalling || !runtimeStatus?.installed}
          isSending={isSending}
          onDraftChange={setDraft}
          onSubmit={() => void handleSend()}
          onStop={handleStopGeneration}
        />
      </main>

      {showRuntimePanel ? (
        <RuntimePanel
          open={showRuntimePanel}
          activeTab={runtimePanelTab}
          runtimeStatus={runtimeStatus}
          runtimeConfig={runtimeConfig}
          activePreset={activePreset}
          hasUnsavedChanges={hasUnsavedRuntimeChanges}
          logs={logs}
          isBusy={isBusy}
          onToggle={() => setShowRuntimePanel((previous) => !previous)}
          onTabChange={setRuntimePanelTab}
          onChange={setRuntimeConfig}
          onApplyPreset={handleApplyPreset}
          onSave={() => void handleSaveConfig()}
          onStart={() => void handleStart()}
          onStop={() => void handleStop()}
          onRestart={() => void handleRestart()}
          onRefreshLogs={() =>
            void api.getRuntimeLogs().then(setLogs).catch((caughtError) => setError((caughtError as Error).message))
          }
        />
      ) : null}
    </div>
  );
}
