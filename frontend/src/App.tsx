import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api } from "./api/client";
import {
  applyRuntimePreset,
  areRuntimeConfigsEqual,
  detectRuntimePreset,
  normalizeRuntimeConfig,
  type RuntimePreset,
} from "./lib/runtime-config";
import { loadUiPrefs, saveUiPrefs } from "./lib/ui-prefs";
import type {
  AssetSourceInfo,
  Conversation,
  ConversationSummary,
  InstallProgress,
  Message,
  ModelDescriptor,
  RuntimeConfig,
  RuntimeStatus,
} from "./types";

type RuntimePanelTab = "runtime" | "parameters" | "logs";

function isMissingConversationError(caughtError: unknown): boolean {
  return caughtError instanceof ApiError && caughtError.status === 404 && caughtError.detail === "Conversation not found.";
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function percent(value: number | null | undefined): string {
  return `${Math.round(value ?? 0)}%`;
}

function runtimeStateLabel(status: RuntimeStatus | null): string {
  if (!status?.installed) {
    return "Setup required";
  }
  if (status.ready) {
    return "Ready";
  }
  if (status.running) {
    return "Booting";
  }
  return "Stopped";
}

function sourceBadge(source: AssetSourceInfo): string {
  return source.kind === "runtime" ? "Runtime" : "Model";
}

function messageRoleLabel(role: Message["role"]): string {
  if (role === "assistant") {
    return "Desk";
  }
  if (role === "system") {
    return "System";
  }
  return "Operator";
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
  const [runtimePathDraft, setRuntimePathDraft] = useState("");
  const [modelPathDraft, setModelPathDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  const setupMode = runtimeStatus ? !runtimeStatus.installed : false;
  const composerDisabled = isBusy || isInstalling || !runtimeStatus?.installed;
  const sourceSummary = assetSources.slice(0, 4);

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
    if (!runtimeConfig) {
      return;
    }
    setRuntimePathDraft(runtimeConfig.runtime_binary_path ?? "");
    setModelPathDraft(runtimeConfig.model_file_path ?? "");
  }, [runtimeConfig?.runtime_binary_path, runtimeConfig?.model_file_path]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages, streamingText]);

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

  async function handlePickRuntimePath() {
    try {
      setError(null);
      const path = await handleBrowseRuntimeBinary();
      if (path) {
        setRuntimePathDraft(path);
      }
    } catch (caughtError) {
      setError((caughtError as Error).message);
    }
  }

  async function handlePickModelPath() {
    try {
      setError(null);
      const path = await handleBrowseModelFile();
      if (path) {
        setModelPathDraft(path);
      }
    } catch (caughtError) {
      setError((caughtError as Error).message);
    }
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
          override_max_tokens: runtimeConfig?.max_tokens,
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
        controller.signal,
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

  function updateConfigNumber(
    key: "ctx_size" | "temperature" | "top_p" | "max_tokens",
    value: string,
  ) {
    if (!runtimeConfig) {
      return;
    }
    const nextValue = Number(value);
    setRuntimeConfig({
      ...runtimeConfig,
      [key]: Number.isFinite(nextValue) ? nextValue : 0,
    });
  }

  function updateConfigString(key: "model_filename" | "system_prompt", value: string) {
    if (!runtimeConfig) {
      return;
    }
    setRuntimeConfig({
      ...runtimeConfig,
      [key]: value,
    });
  }

  if (isHydrating) {
    return (
      <main className="min-h-screen bg-[#07111a] text-[#edf5ef]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/30 backdrop-blur"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Bonsai Desk</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Loading local runtime state...</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Checking your local runtime, saved model config, and conversation history before opening the desk.
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  if (!runtimeStatus || !runtimeConfig) {
    return (
      <main className="min-h-screen bg-[#07111a] text-[#edf5ef]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <div className="w-full rounded-[32px] border border-rose-400/20 bg-rose-500/10 p-10 shadow-2xl shadow-black/30 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">Bonsai Desk</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Backend not reachable.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The frontend could not load the local backend state. Start the backend first, then reload the page.
            </p>
            {error ? <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(53,109,98,0.28),_transparent_32%),linear-gradient(180deg,_#081018_0%,_#07131c_52%,_#061017_100%)] text-[#edf5ef]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-12 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute right-[-5rem] top-24 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex w-full shrink-0 flex-col border-b border-white/10 bg-black/20 backdrop-blur-xl lg:min-h-screen lg:w-[19rem] lg:border-b-0 lg:border-r"
        >
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/70">Local History</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">Bonsai Desk</h1>
              </div>
              <button
                type="button"
                onClick={() => void handleCreateConversation()}
                className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:border-emerald-200/40 hover:bg-emerald-300/20"
              >
                New chat
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Runtime</div>
                <div className="mt-2 text-sm font-medium text-white">{runtimeStateLabel(runtimeStatus)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Conversations</div>
                <div className="mt-2 text-sm font-medium text-white">{conversations.length}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {conversations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm leading-6 text-slate-300">
                No saved conversations yet. Start a local thread to build your desk history.
              </div>
            ) : null}
            {conversations.map((conversation) => {
              const isActive = selectedConversation?.id === conversation.id;
              return (
                <div
                  key={conversation.id}
                  className={cx(
                    "group rounded-[24px] border px-4 py-4 transition",
                    isActive
                      ? "border-emerald-300/30 bg-emerald-300/12 shadow-lg shadow-emerald-950/20"
                      : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => void handleSelectConversation(conversation.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm font-medium text-white">{conversation.title}</div>
                      <div className="mt-1 text-xs text-slate-400">Updated {formatDate(conversation.updated_at)}</div>
                    </button>
                    <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => void handleRenameConversation(conversation.id)}
                        className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteConversation(conversation.id)}
                        className="rounded-full border border-rose-300/20 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-300/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 max-h-10 overflow-hidden text-xs leading-5 text-slate-300/80">
                    {conversation.preview || "No preview yet."}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.aside>

        <section className="min-h-0 flex-1">
          <div className="flex h-full flex-col">
            <motion.header
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="sticky top-0 z-20 border-b border-white/10 bg-[#09131bcc]/95 px-4 py-4 backdrop-blur-xl lg:px-8"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/70">Operator Workspace</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {selectedConversation?.title ?? (setupMode ? "Provision your local desk" : "New conversation")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {runtimeStatus.health_url} - {runtimeStatus.model_path ?? runtimeConfig.model_filename}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                    {runtimeStateLabel(runtimeStatus)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                    {runtimeStatus.pid ? `PID ${runtimeStatus.pid}` : "No process"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void refreshConversations(selectedConversation?.id ?? null)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
                  >
                    Refresh chats
                  </button>
                  <button
                    type="button"
                    onClick={() => void refreshRuntime()}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
                  >
                    Refresh runtime
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRuntimePanel((previous) => !previous)}
                    className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/20"
                  >
                    {showRuntimePanel ? "Hide rail" : "Show rail"}
                  </button>
                </div>
              </div>
            </motion.header>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-h-0 overflow-y-auto px-4 py-4 lg:px-8 lg:py-6">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="mx-auto flex w-full max-w-5xl flex-col gap-5"
                >
                  {error ? (
                    <div className="rounded-[24px] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div>
                  ) : null}

                  <section className="overflow-hidden rounded-[30px] border border-white/10 bg-black/20 shadow-2xl shadow-black/20 backdrop-blur">
                    <div className="border-b border-white/10 px-5 py-4 lg:px-6">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Live Chat</p>
                          <h3 className="mt-2 text-lg font-semibold text-white">
                            {selectedConversation?.title ?? "Start a new operator thread"}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                            {runtimeStatus.ready ? "Inference online" : "Runtime standby"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                            {visibleMessages.length + (streamingText ? 1 : 0)} entries
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[52vh] space-y-4 overflow-y-auto px-5 py-5 lg:px-6">
                      {setupMode ? (
                        <div className="rounded-[28px] border border-dashed border-amber-200/20 bg-amber-100/5 p-6 text-sm leading-6 text-slate-200">
                          Install or link your local runtime assets to unlock chat. The desk stays wired to the same backend actions while setup runs.
                        </div>
                      ) : null}

                      {!setupMode && visibleMessages.length === 0 && !streamingText ? (
                        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-6 text-slate-300">
                          No messages yet. Use the composer to open a new local conversation.
                        </div>
                      ) : null}

                      {visibleMessages.map((message, index) => {
                        const isAssistant = message.role === "assistant";
                        return (
                          <motion.article
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.12) }}
                            className={cx(
                              "rounded-[26px] border px-4 py-4 lg:px-5",
                              isAssistant
                                ? "border-emerald-300/15 bg-emerald-300/[0.07]"
                                : message.role === "system"
                                  ? "border-amber-200/15 bg-amber-200/[0.06]"
                                  : "border-white/10 bg-white/[0.03]",
                            )}
                          >
                            <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
                              <span className="uppercase tracking-[0.28em]">{messageRoleLabel(message.role)}</span>
                              <span>{formatDate(message.created_at)}</span>
                            </div>
                            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">{message.content}</div>
                          </motion.article>
                        );
                      })}

                      {streamingText ? (
                        <motion.article
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-4 lg:px-5"
                        >
                          <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
                            <span className="uppercase tracking-[0.28em]">Desk</span>
                            <span>Streaming...</span>
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">{streamingText}</div>
                        </motion.article>
                      ) : null}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-white/10 px-5 py-5 lg:px-6">
                      <div className="rounded-[26px] border border-white/10 bg-[#0b1620] p-4">
                        <textarea
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void handleSend();
                            }
                          }}
                          placeholder={setupMode ? "Finish setup to begin local inference." : "Ask Bonsai Desk to inspect, plan, or generate."}
                          disabled={composerDisabled || isSending}
                          rows={4}
                          className="w-full resize-none border-0 bg-transparent text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
                        />
                        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                            <span className="rounded-full border border-white/10 px-3 py-1.5">Shift+Enter for newline</span>
                            <span className="rounded-full border border-white/10 px-3 py-1.5">System prompt from runtime config</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {isSending ? (
                              <button
                                type="button"
                                onClick={handleStopGeneration}
                                className="rounded-full border border-rose-300/20 bg-rose-300/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-300/20"
                              >
                                Stop generation
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void handleSend()}
                              disabled={composerDisabled || isSending || !draft.trim()}
                              className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isSending ? "Streaming..." : "Send prompt"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/70">Guided Setup</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">Keep the desk operator-grade and local-first.</h3>
                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                          <div className="text-sm font-medium text-white">1. Link assets</div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">Use the runtime rail to browse or paste local runtime and model paths.</p>
                        </div>
                        <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                          <div className="text-sm font-medium text-white">2. Tune inference</div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">Switch presets, adjust context and sampling, then save to persist config.</p>
                        </div>
                        <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                          <div className="text-sm font-medium text-white">3. Run local chat</div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">Start or restart the runtime without changing the existing backend flow.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/70">Trust Signals</p>
                      <div className="mt-4 space-y-3 text-sm text-slate-300">
                        <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                          <div className="text-white">Endpoint</div>
                          <div className="mt-1 break-all text-slate-300">{runtimeStatus.health_url}</div>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                          <div className="text-white">Install progress</div>
                          <div className="mt-1 text-slate-300">{percent(installProgress?.overall_progress)} - {installProgress?.current_step ?? "Idle"}</div>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                          <div className="text-white">Active model</div>
                          <div className="mt-1 break-all text-slate-300">{runtimeConfig.model_filename}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[30px] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(24,57,53,0.72),rgba(8,20,28,0.88))] p-6 shadow-xl shadow-black/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/70">Control Surface</p>
                        <h3 className="mt-3 text-xl font-semibold text-white">Open the runtime rail for full model, logs, and diagnostics control.</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                          Save config, refresh logs, link local files, and operate the runtime without leaving the chat workspace.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRuntimePanel(true)}
                        className="rounded-full border border-emerald-200/30 bg-emerald-300/10 px-5 py-3 text-sm font-medium text-emerald-50 transition hover:bg-emerald-300/20"
                      >
                        Open runtime rail
                      </button>
                    </div>
                  </section>
                </motion.div>
              </div>

              <AnimatePresence initial={false}>
                {showRuntimePanel ? (
                  <motion.aside
                    key="runtime-rail"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="h-full w-full border-t border-white/10 bg-[#09141dcc] backdrop-blur-xl lg:w-[25rem] lg:border-l lg:border-t-0"
                  >
                    <div className="flex h-full flex-col">
                      <div className="border-b border-white/10 px-5 py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Runtime Rail</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">Controls and diagnostics</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRuntimePanel(false)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                          >
                            Close
                          </button>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {(["runtime", "parameters", "logs"] as RuntimePanelTab[]).map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setRuntimePanelTab(tab)}
                              className={cx(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                                runtimePanelTab === tab
                                  ? "border-emerald-300/30 bg-emerald-300/12 text-emerald-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                              )}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                        {runtimePanelTab === "runtime" ? (
                          <>
                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleInstall()}
                                  disabled={isBusy || isInstalling}
                                  className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-200/20 disabled:opacity-50"
                                >
                                  {isInstalling ? "Installing..." : "Install runtime"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleStart()}
                                  disabled={isBusy || isInstalling}
                                  className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/20 disabled:opacity-50"
                                >
                                  Start
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleStop()}
                                  disabled={isBusy}
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10 disabled:opacity-50"
                                >
                                  Stop
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleRestart()}
                                  disabled={isBusy || isInstalling}
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10 disabled:opacity-50"
                                >
                                  Restart
                                </button>
                              </div>

                              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                                <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">
                                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">State</div>
                                  <div className="mt-2 text-white">{runtimeStateLabel(runtimeStatus)}</div>
                                  <div className="mt-1 text-xs text-slate-400">{runtimeStatus.install_message ?? runtimeStatus.last_error ?? "Local runtime standing by."}</div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">
                                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Health</div>
                                    <div className="mt-2 break-all text-white">{runtimeStatus.health_url}</div>
                                  </div>
                                  <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">
                                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Install</div>
                                    <div className="mt-2 text-white">{percent(installProgress?.overall_progress)}</div>
                                  </div>
                                </div>
                              </div>
                            </section>

                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-medium text-white">Local file linking</h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleUseExistingAssets({
                                      runtime_binary_path: runtimePathDraft || null,
                                      model_file_path: modelPathDraft || null,
                                    })
                                  }
                                  disabled={isBusy}
                                  className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/20 disabled:opacity-50"
                                >
                                  Use existing assets
                                </button>
                              </div>

                              <div className="mt-4 space-y-4">
                                <div>
                                  <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Runtime binary path</label>
                                  <div className="flex gap-2">
                                    <input
                                      value={runtimePathDraft}
                                      onChange={(event) => setRuntimePathDraft(event.target.value)}
                                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0b1620] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => void handlePickRuntimePath()}
                                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                                    >
                                      Browse
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Model file path</label>
                                  <div className="flex gap-2">
                                    <input
                                      value={modelPathDraft}
                                      onChange={(event) => setModelPathDraft(event.target.value)}
                                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0b1620] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => void handlePickModelPath()}
                                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                                    >
                                      Browse
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </section>

                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <h4 className="text-sm font-medium text-white">Diagnostics</h4>
                              <div className="mt-4 space-y-3 text-sm text-slate-300">
                                <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">Binary: {runtimeStatus.binary_path ?? "Not linked"}</div>
                                <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">Model: {runtimeStatus.model_path ?? "Not linked"}</div>
                                <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">Last error: {runtimeStatus.last_error ?? "None"}</div>
                              </div>
                            </section>
                          </>
                        ) : null}

                        {runtimePanelTab === "parameters" ? (
                          <>
                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-medium text-white">Preset buttons</h4>
                                <span className="text-xs text-slate-400">Active: {activePreset ?? "custom"}</span>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {(["demo", "power", "max"] as RuntimePreset[]).map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleApplyPreset(preset)}
                                    className={cx(
                                      "rounded-full border px-3 py-2 text-xs font-medium transition",
                                      activePreset === preset
                                        ? "border-emerald-300/30 bg-emerald-300/12 text-emerald-100"
                                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                                    )}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </section>

                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <h4 className="text-sm font-medium text-white">Model and inference</h4>
                              <div className="mt-4 space-y-4">
                                <div>
                                  <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Model switcher</label>
                                  <select
                                    value={runtimeConfig.model_filename}
                                    onChange={(event) => updateConfigString("model_filename", event.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0b1620] px-3 py-2 text-sm text-slate-100 outline-none"
                                  >
                                    {models.map((model) => (
                                      <option key={model.id} value={model.filename}>
                                        {model.name} - {model.size_hint}{model.installed ? "" : " (remote)"}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">ctx_size</label>
                                    <input
                                      type="number"
                                      value={runtimeConfig.ctx_size}
                                      onChange={(event) => updateConfigNumber("ctx_size", event.target.value)}
                                      className="w-full rounded-2xl border border-white/10 bg-[#0b1620] px-3 py-2 text-sm text-slate-100 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">temperature</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={runtimeConfig.temperature}
                                      onChange={(event) => updateConfigNumber("temperature", event.target.value)}
                                      className="w-full rounded-2xl border border-white/10 bg-[#0b1620] px-3 py-2 text-sm text-slate-100 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">top_p</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={runtimeConfig.top_p}
                                      onChange={(event) => updateConfigNumber("top_p", event.target.value)}
                                      className="w-full rounded-2xl border border-white/10 bg-[#0b1620] px-3 py-2 text-sm text-slate-100 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">max_tokens</label>
                                    <input
                                      type="number"
                                      value={runtimeConfig.max_tokens}
                                      onChange={(event) => updateConfigNumber("max_tokens", event.target.value)}
                                      className="w-full rounded-2xl border border-white/10 bg-[#0b1620] px-3 py-2 text-sm text-slate-100 outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">System prompt</label>
                                  <textarea
                                    rows={5}
                                    value={runtimeConfig.system_prompt}
                                    onChange={(event) => updateConfigString("system_prompt", event.target.value)}
                                    className="w-full rounded-[22px] border border-white/10 bg-[#0b1620] px-3 py-3 text-sm leading-6 text-slate-100 outline-none"
                                  />
                                </div>
                              </div>
                            </section>

                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-medium text-white">Persist config</h4>
                                <span className="text-xs text-slate-400">{hasUnsavedRuntimeChanges ? "Unsaved changes" : "Saved"}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleSaveConfig()}
                                disabled={!hasUnsavedRuntimeChanges || isBusy}
                                className="mt-4 w-full rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Save runtime config
                              </button>
                            </section>
                          </>
                        ) : null}

                        {runtimePanelTab === "logs" ? (
                          <>
                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-medium text-white">Logs</h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void api.getRuntimeLogs().then(setLogs).catch((caughtError) => setError((caughtError as Error).message))
                                  }
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                  Refresh logs
                                </button>
                              </div>
                              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-[22px] border border-white/10 bg-[#071018] p-3 font-mono text-xs leading-5 text-slate-300">
                                {logs.length === 0 ? <div>No logs available.</div> : null}
                                {logs.map((line, index) => (
                                  <div key={`${line}-${index}`}>{line}</div>
                                ))}
                              </div>
                            </section>

                            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                              <h4 className="text-sm font-medium text-white">Official source summaries</h4>
                              <div className="mt-4 space-y-3">
                                {sourceSummary.map((source) => (
                                  <div key={source.id} className="rounded-[22px] border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="font-medium text-white">{source.title}</div>
                                      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                                        {sourceBadge(source)}
                                      </span>
                                    </div>
                                    <p className="mt-2 leading-6 text-slate-300">{source.summary}</p>
                                    <div className="mt-3 text-xs text-slate-400">{source.license_name} - {source.source_url}</div>
                                  </div>
                                ))}
                                {sourceSummary.length === 0 ? (
                                  <div className="rounded-[22px] border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-400">
                                    No upstream source metadata available.
                                  </div>
                                ) : null}
                              </div>
                            </section>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </motion.aside>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
