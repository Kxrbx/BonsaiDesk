/**
 * API client for Bonsai Desk backend.
 *
 * This module provides a type-safe HTTP client for communicating
 * with the FastAPI backend, including streaming chat support.
 */

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

// Determine API base URL from environment or defaults
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBase =
  window.location.port === "5173" ? "http://127.0.0.1:8000/api" : `${window.location.origin}/api`;
const API_BASE = (configuredApiBase || defaultApiBase).replace(/\/$/, "");

/**
 * Custom error class for API errors.
 *
 * Includes HTTP status code and error detail for better error handling.
 */
export class ApiError extends Error {
  /** HTTP status code */
  status: number;
  /** Error detail message */
  detail: string;

  /**
   * Create a new ApiError.
   *
   * @param status - HTTP status code
   * @param detail - Error detail message
   */
  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Make a generic API request.
 *
 * @typeParam T - Expected response type
 * @param path - API endpoint path
 * @param init - Optional fetch init options
 * @returns Promise resolving to the response data
 * @throws ApiError if the request fails
 */
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

/**
 * API client object with methods for all backend endpoints.
 */
export const api = {
  /** Get current runtime status */
  getRuntimeStatus: () => request<RuntimeStatus>("/runtime/status"),

  /** Get complete runtime overview */
  getRuntimeOverview: () => request<RuntimeOverview>("/runtime/overview"),

  /** Get structured runtime diagnostics */
  getRuntimeDiagnostics: () => request<RuntimeOverview["diagnostics"]>("/runtime/diagnostics"),

  /** Get current runtime configuration */
  getRuntimeConfig: () => request<RuntimeConfig>("/runtime/config"),

  /** Get installation progress */
  getInstallProgress: () => request<InstallProgress>("/runtime/install-progress"),

  /** Update runtime configuration */
  updateRuntimeConfig: (config: RuntimeConfig) =>
    request<RuntimeConfig>("/runtime/config", {
      method: "PUT",
      body: JSON.stringify(config)
    }),

  /** Open file dialog to browse for runtime binary */
  browseRuntimeBinary: () => request<{ path: string | null }>("/runtime/browse-binary", { method: "POST" }),

  /** Open file dialog to browse for model file */
  browseModelFile: () => request<{ path: string | null }>("/runtime/browse-model", { method: "POST" }),

  /** Configure to use existing local assets */
  useExistingAssets: (payload: { runtime_binary_path?: string | null; model_file_path?: string | null }) =>
    request<RuntimeOverview>("/runtime/use-existing-assets", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  /** Start runtime installation */
  installRuntime: () => request<InstallProgress>("/runtime/install", { method: "POST" }),

  /** Start the runtime */
  startRuntime: () => request<RuntimeStatus>("/runtime/start", { method: "POST" }),

  /** Stop the runtime */
  stopRuntime: () => request<RuntimeStatus>("/runtime/stop", { method: "POST" }),

  /** Restart the runtime */
  restartRuntime: () => request<RuntimeStatus>("/runtime/restart", { method: "POST" }),

  /** Get recent runtime logs */
  getRuntimeLogs: () => request<string[]>("/runtime/logs"),

  /** List available models */
  listModels: () => request<ModelDescriptor[]>("/models"),

  /** Select a Bonsai model variant */
  selectModelVariant: (variant: string) =>
    request<RuntimeOverview>("/models/select", {
      method: "POST",
      body: JSON.stringify({ variant })
    }),

  /** Install a specific Bonsai model variant */
  installModelVariant: (variant: string) =>
    request<InstallProgress>("/models/install", {
      method: "POST",
      body: JSON.stringify({ variant })
    }),

  /** List all conversations */
  listConversations: () => request<ConversationSummary[]>("/conversations"),

  /** Create a new conversation */
  createConversation: (title?: string) =>
    request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ title })
    }),

  /** Get a specific conversation */
  getConversation: (conversationId: string) =>
    request<Conversation>(`/conversations/${conversationId}`),

  /** Rename a conversation */
  renameConversation: (conversationId: string, title: string) =>
    request<Conversation>(`/conversations/${conversationId}`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    }),

  /** Delete a conversation */
  deleteConversation: (conversationId: string) =>
    request<{ deleted: boolean }>(`/conversations/${conversationId}`, { method: "DELETE" }),

  /**
   * Stream a chat response.
   *
   * Sends a chat request and processes the streaming response,
   * calling the onEvent callback for each event received.
   *
   * @param payload - Chat request payload
   * @param onEvent - Callback for each stream event
   * @param signal - Optional AbortSignal for cancellation
   * @throws ApiError if streaming fails
   */
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
