from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class RuntimeConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8080
    model_filename: str = "Bonsai-8B.gguf"
    runtime_binary_path: str | None = None
    model_file_path: str | None = None
    system_prompt: str = "You are a helpful assistant."
    temperature: float = 0.6
    top_k: int = 40
    top_p: float = 0.92
    min_p: float = 0.0
    max_tokens: int = 1024
    ctx_size: int = 0
    gpu_layers: int = 99
    threads: int = 8
    reasoning_budget: int = -1
    reasoning_format: str = "none"
    enable_thinking: bool = True

    @field_validator("reasoning_budget", mode="before")
    @classmethod
    def normalize_reasoning_budget(cls, value: object) -> int:
        if value in (None, ""):
            return -1
        try:
            budget = int(value)
        except (TypeError, ValueError):
            return -1
        return 0 if budget == 0 else -1

    @field_validator("runtime_binary_path", "model_file_path", mode="before")
    @classmethod
    def normalize_optional_path_fields(cls, value: object) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    @field_validator("model_filename", "system_prompt", "reasoning_format", mode="before")
    @classmethod
    def normalize_required_text_fields(cls, value: object) -> str:
        if value is None:
            return ""
        return str(value).strip()


class RuntimeStatus(BaseModel):
    installed: bool
    running: bool
    ready: bool
    binary_path: str | None = None
    model_path: str | None = None
    pid: int | None = None
    host: str
    port: int
    health_url: str
    runtime_source: str | None = None
    model_source: str | None = None
    install_message: str | None = None
    last_error: str | None = None
    config: RuntimeConfig


class InstallStageProgress(BaseModel):
    id: str
    label: str
    status: Literal["pending", "running", "completed", "skipped", "error"]
    progress: float = 0.0
    detail: str | None = None


class InstallProgress(BaseModel):
    state: Literal["idle", "running", "completed", "error"]
    overall_progress: float = 0.0
    current_step: str
    message: str | None = None
    error: str | None = None
    started_at: datetime | None = None
    updated_at: datetime
    stages: list[InstallStageProgress] = Field(default_factory=list)


class ModelDescriptor(BaseModel):
    id: str
    name: str
    filename: str
    size_hint: str
    local_path: str | None = None
    installed: bool


class AssetSourceInfo(BaseModel):
    id: str
    title: str
    kind: Literal["runtime", "model"]
    source_url: str
    license_name: str
    summary: str


class RuntimeOverview(BaseModel):
    status: RuntimeStatus
    config: RuntimeConfig
    models: list[ModelDescriptor] = Field(default_factory=list)
    install_progress: InstallProgress
    sources: list[AssetSourceInfo] = Field(default_factory=list)


class FileSelectionResult(BaseModel):
    path: str | None = None


class UseExistingAssetsRequest(BaseModel):
    runtime_binary_path: str | None = None
    model_file_path: str | None = None


class Message(BaseModel):
    id: str
    conversation_id: str
    role: Literal["system", "user", "assistant"]
    content: str
    created_at: datetime


class Conversation(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[Message] = Field(default_factory=list)


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    preview: str = ""


class CreateConversationRequest(BaseModel):
    title: str | None = None


class UpdateConversationRequest(BaseModel):
    title: str


class ChatGenerationRequest(BaseModel):
    conversation_id: str | None = None
    content: str = Field(min_length=1)
    override_system_prompt: str | None = None
    override_temperature: float | None = None
    override_top_k: int | None = None
    override_top_p: float | None = None
    override_min_p: float | None = None
    override_max_tokens: int | None = None


class ChatStreamEvent(BaseModel):
    type: Literal["meta", "delta", "done", "error"]
    conversation_id: str | None = None
    message_id: str | None = None
    delta: str | None = None
    error: str | None = None
