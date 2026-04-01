export type MessageRole = "system" | "user" | "assistant";

export interface RuntimeConfig {
  host: string;
  port: number;
  model_filename: string;
  runtime_binary_path: string | null;
  model_file_path: string | null;
  system_prompt: string;
  temperature: number;
  top_k: number;
  top_p: number;
  min_p: number;
  max_tokens: number;
  ctx_size: number;
  gpu_layers: number;
  threads: number;
  reasoning_budget: number;
  reasoning_format: string;
  enable_thinking: boolean;
}

export interface RuntimeStatus {
  installed: boolean;
  running: boolean;
  ready: boolean;
  binary_path: string | null;
  model_path: string | null;
  pid: number | null;
  host: string;
  port: number;
  health_url: string;
  runtime_source: string | null;
  model_source: string | null;
  install_message: string | null;
  last_error: string | null;
  config: RuntimeConfig;
}

export interface InstallStageProgress {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "skipped" | "error";
  progress: number;
  detail: string | null;
}

export interface InstallProgress {
  state: "idle" | "running" | "completed" | "error";
  overall_progress: number;
  current_step: string;
  message: string | null;
  error: string | null;
  started_at: string | null;
  updated_at: string;
  stages: InstallStageProgress[];
}

export interface RuntimeOverview {
  status: RuntimeStatus;
  config: RuntimeConfig;
  models: ModelDescriptor[];
  install_progress: InstallProgress;
  sources: AssetSourceInfo[];
}

export interface ModelDescriptor {
  id: string;
  name: string;
  filename: string;
  size_hint: string;
  local_path: string | null;
  installed: boolean;
}

export interface AssetSourceInfo {
  id: string;
  title: string;
  kind: "runtime" | "model";
  source_url: string;
  license_name: string;
  summary: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview: string;
}

export interface ChatStreamEvent {
  type: "meta" | "delta" | "done" | "error";
  conversation_id: string | null;
  message_id: string | null;
  delta: string | null;
  error: string | null;
}
