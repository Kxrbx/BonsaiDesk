import type {
  ChatStreamEvent,
  Conversation,
  ConversationSummary,
  InstallProgress,
  ModelDescriptor,
  RuntimeConfig,
  RuntimeOverview,
  RuntimeStatus
} from "../types";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBase =
  window.location.port === "5173" ? "http://127.0.0.1:8000/api" : `${window.location.origin}/api`;
const API_BASE = (configuredApiBase || defaultApiBase).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined)
  };

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init
  });

  if (!response.ok) {
    const payload = await response.text();
    let detail = payload || `Request failed for ${path}`;

    if (payload) {
      try {
        const parsed = JSON.parse(payload) as { detail?: string; message?: string };
        detail = parsed.detail ?? parsed.message ?? detail;
      } catch {
        detail = payload;
      }
    }

    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getRuntimeStatus: () => request<RuntimeStatus>("/runtime/status"),
  getRuntimeOverview: () => request<RuntimeOverview>("/runtime/overview"),
  getRuntimeConfig: () => request<RuntimeConfig>("/runtime/config"),
  getInstallProgress: () => request<InstallProgress>("/runtime/install-progress"),
  updateRuntimeConfig: (config: RuntimeConfig) =>
    request<RuntimeConfig>("/runtime/config", {
      method: "PUT",
      body: JSON.stringify(config)
    }),
  browseRuntimeBinary: () => request<{ path: string | null }>("/runtime/browse-binary", { method: "POST" }),
  browseModelFile: () => request<{ path: string | null }>("/runtime/browse-model", { method: "POST" }),
  useExistingAssets: (payload: { runtime_binary_path?: string | null; model_file_path?: string | null }) =>
    request<RuntimeOverview>("/runtime/use-existing-assets", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  installRuntime: () => request<InstallProgress>("/runtime/install", { method: "POST" }),
  startRuntime: () => request<RuntimeStatus>("/runtime/start", { method: "POST" }),
  stopRuntime: () => request<RuntimeStatus>("/runtime/stop", { method: "POST" }),
  restartRuntime: () => request<RuntimeStatus>("/runtime/restart", { method: "POST" }),
  getRuntimeLogs: () => request<string[]>("/runtime/logs"),
  listModels: () => request<ModelDescriptor[]>("/models"),
  listConversations: () => request<ConversationSummary[]>("/conversations"),
  createConversation: (title?: string) =>
    request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ title })
    }),
  getConversation: (conversationId: string) =>
    request<Conversation>(`/conversations/${conversationId}`),
  renameConversation: (conversationId: string, title: string) =>
    request<Conversation>(`/conversations/${conversationId}`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    }),
  deleteConversation: (conversationId: string) =>
    request<{ deleted: boolean }>(`/conversations/${conversationId}`, { method: "DELETE" }),
  async streamChat(
    payload: {
      conversation_id?: string | null;
      content: string;
      override_system_prompt?: string;
      override_temperature?: number;
      override_top_k?: number;
      override_top_p?: number;
      override_min_p?: number;
      override_max_tokens?: number;
    },
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok || !response.body) {
      const payloadText = await response.text();
      throw new Error(payloadText || "Unable to stream chat.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawTerminalEvent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventBlock of events) {
        const line = eventBlock
          .split("\n")
          .find((part) => part.startsWith("data:"));
        if (!line) {
          continue;
        }
        const json = line.slice(5).trim();
        if (!json) {
          continue;
        }
        const event = JSON.parse(json) as ChatStreamEvent;
        onEvent(event);
        if (event.type === "error") {
          throw new ApiError(502, event.error ?? "Streaming failed.");
        }
        if (event.type === "done") {
          sawTerminalEvent = true;
        }
      }
    }

    if (!sawTerminalEvent && !signal?.aborted) {
      throw new Error("The local chat stream ended unexpectedly before completion.");
    }
  }
};
