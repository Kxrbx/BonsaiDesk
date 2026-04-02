/**
 * TypeScript type definitions for Bonsai Desk.
 *
 * This module defines all interfaces used throughout the frontend
 * for type-safe communication with the backend API.
 */

/** Valid roles for chat messages */
export type MessageRole = "system" | "user" | "assistant";

/**
 * Runtime configuration settings.
 *
 * Controls the behavior of the llama-server runtime including
 * model parameters, inference settings, and connection details.
 */
export interface RuntimeConfig {
  /** Host address for the runtime server */
  host: string;
  /** Port number for the runtime server */
  port: number;
  /** Name of the GGUF model file */
  model_filename: string;
  /** Optional path to custom runtime binary */
  runtime_binary_path: string | null;
  /** Optional path to custom model file */
  model_file_path: string | null;
  /** System prompt for the model */
  system_prompt: string;
  /** Sampling temperature (0.0-2.0) */
  temperature: number;
  /** Top-k sampling parameter */
  top_k: number;
  /** Top-p (nucleus) sampling parameter */
  top_p: number;
  /** Minimum probability threshold */
  min_p: number;
  /** Maximum tokens per response */
  max_tokens: number;
  /** Context window size (0 = model default) */
  ctx_size: number;
  /** Number of layers to offload to GPU */
  gpu_layers: number;
  /** Number of CPU threads to use */
  threads: number;
  /** Reasoning token budget (-1 = disabled) */
  reasoning_budget: number;
  /** Format for reasoning output */
  reasoning_format: string;
  /** Whether to enable thinking mode */
  enable_thinking: boolean;
}

/**
 * Current status of the runtime.
 *
 * Provides comprehensive information about runtime state,
 * installation status, and health.
 */
export interface RuntimeStatus {
  /** Whether runtime and model are installed */
  installed: boolean;
  /** Whether the runtime process is running */
  running: boolean;
  /** Whether the runtime is healthy and ready */
  ready: boolean;
  /** Path to the runtime binary */
  binary_path: string | null;
  /** Path to the model file */
  model_path: string | null;
  /** Process ID of the runtime */
  pid: number | null;
  /** Host address of the runtime */
  host: string;
  /** Port number of the runtime */
  port: number;
  /** URL for health checks */
  health_url: string;
  /** Source of the runtime binary */
  runtime_source: string | null;
  /** Source of the model */
  model_source: string | null;
  /** Message about installation status */
  install_message: string | null;
  /** Last error message if any */
  last_error: string | null;
  /** Current runtime configuration */
  config: RuntimeConfig;
}

/**
 * Progress information for an installation stage.
 */
export interface InstallStageProgress {
  /** Unique identifier for the stage */
  id: string;
  /** Human-readable label for the stage */
  label: string;
  /** Current status of the stage */
  status: "pending" | "running" | "completed" | "skipped" | "error";
  /** Progress percentage (0-100) */
  progress: number;
  /** Detailed status message */
  detail: string | null;
}

/**
 * Overall installation progress.
 *
 * Aggregates progress across all installation stages.
 */
export interface InstallProgress {
  /** Overall installation state */
  state: "idle" | "running" | "completed" | "error";
  /** Weighted progress percentage */
  overall_progress: number;
  /** Current step description */
  current_step: string;
  /** Status message */
  message: string | null;
  /** Error message if failed */
  error: string | null;
  /** When installation started */
  started_at: string | null;
  /** When progress was last updated */
  updated_at: string;
  /** List of individual stage progress */
  stages: InstallStageProgress[];
}

/**
 * Complete runtime overview for the UI.
 */
export interface RuntimeOverview {
  /** Current runtime status */
  status: RuntimeStatus;
  /** Current runtime configuration */
  config: RuntimeConfig;
  /** List of available models */
  models: ModelDescriptor[];
  /** Installation progress information */
  install_progress: InstallProgress;
  /** List of upstream asset sources */
  sources: AssetSourceInfo[];
}

/**
 * Information about an available model.
 */
export interface ModelDescriptor {
  /** Unique model identifier */
  id: string;
  /** Human-readable model name */
  name: string;
  /** Model filename */
  filename: string;
  /** Human-readable size hint */
  size_hint: string;
  /** Path to local file if installed */
  local_path: string | null;
  /** Whether the model is installed locally */
  installed: boolean;
}

/**
 * Information about an upstream asset source.
 */
export interface AssetSourceInfo {
  /** Unique source identifier */
  id: string;
  /** Human-readable source title */
  title: string;
  /** Type of asset (runtime or model) */
  kind: "runtime" | "model";
  /** URL to the source */
  source_url: string;
  /** License name (e.g., "MIT", "Apache-2.0") */
  license_name: string;
  /** Brief description of the source */
  summary: string;
}

/**
 * A chat message.
 */
export interface Message {
  /** Unique message identifier */
  id: string;
  /** ID of the conversation */
  conversation_id: string;
  /** Message role (system, user, or assistant) */
  role: MessageRole;
  /** Message content */
  content: string;
  /** When the message was created (ISO 8601) */
  created_at: string;
}

/**
 * A conversation with all messages.
 */
export interface Conversation {
  /** Unique conversation identifier */
  id: string;
  /** Conversation title */
  title: string;
  /** When the conversation was created (ISO 8601) */
  created_at: string;
  /** When the conversation was last updated (ISO 8601) */
  updated_at: string;
  /** List of messages in the conversation */
  messages: Message[];
}

/**
 * Summary of a conversation for listing.
 */
export interface ConversationSummary {
  /** Unique conversation identifier */
  id: string;
  /** Conversation title */
  title: string;
  /** When the conversation was created (ISO 8601) */
  created_at: string;
  /** When the conversation was last updated (ISO 8601) */
  updated_at: string;
  /** Preview of the first message */
  preview: string;
}

/**
 * Event in a chat stream.
 */
export interface ChatStreamEvent {
  /** Event type (meta, delta, done, error) */
  type: "meta" | "delta" | "done" | "error";
  /** ID of the conversation */
  conversation_id: string | null;
  /** ID of the assistant message */
  message_id: string | null;
  /** Text delta for delta events */
  delta: string | null;
  /** Error message for error events */
  error: string | null;
}
