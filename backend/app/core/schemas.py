"""Pydantic schemas for data validation and serialization.

This module defines all Pydantic models used for request/response
validation, configuration management, and data transfer between
components.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class RuntimeConfig(BaseModel):
    """Configuration for the llama-server runtime.
    
    Holds all parameters that control runtime behavior, including
    model settings, inference parameters, and system configuration.
    
    Attributes:
        host: Host address for the runtime server.
        port: Port number for the runtime server.
        model_filename: Name of the GGUF model file.
        runtime_binary_path: Optional path to custom runtime binary.
        model_file_path: Optional path to custom model file.
        system_prompt: System prompt for the model.
        temperature: Sampling temperature (0.0-2.0).
        top_k: Top-k sampling parameter.
        top_p: Top-p (nucleus) sampling parameter.
        min_p: Minimum probability threshold.
        max_tokens: Maximum tokens per response.
        ctx_size: Context window size (0 = model default).
        gpu_layers: Number of layers to offload to GPU.
        threads: Number of CPU threads to use.
        reasoning_budget: Reasoning token budget (-1 = disabled).
        reasoning_format: Format for reasoning output.
        enable_thinking: Whether to enable thinking mode.
    """
    
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
        """Normalize reasoning budget to integer value.
        
        Args:
            value: Input value to normalize.
            
        Returns:
            int: Normalized budget value (-1 for disabled).
        """
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
        """Normalize optional path fields.
        
        Args:
            value: Input value to normalize.
            
        Returns:
            str | None: Stripped string or None if empty.
        """
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    @field_validator("model_filename", "system_prompt", "reasoning_format", mode="before")
    @classmethod
    def normalize_required_text_fields(cls, value: object) -> str:
        """Normalize required text fields.
        
        Args:
            value: Input value to normalize.
            
        Returns:
            str: Stripped string or empty string if None.
        """
        if value is None:
            return ""
        return str(value).strip()


class RuntimeStatus(BaseModel):
    """Current status of the runtime.
    
    Provides comprehensive information about the runtime state,
    including installation status, process information, and health.
    
    Attributes:
        installed: Whether runtime and model are installed.
        running: Whether the runtime process is running.
        ready: Whether the runtime is healthy and ready.
        binary_path: Path to the runtime binary.
        model_path: Path to the model file.
        pid: Process ID of the runtime.
        host: Host address of the runtime.
        port: Port number of the runtime.
        health_url: URL for health checks.
        runtime_source: Source of the runtime binary.
        model_source: Source of the model.
        install_message: Message about installation status.
        last_error: Last error message if any.
        config: Current runtime configuration.
    """
    
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
    """Progress information for an installation stage.
    
    Tracks the status of a single stage in the installation process.
    
    Attributes:
        id: Unique identifier for the stage.
        label: Human-readable label for the stage.
        status: Current status of the stage.
        progress: Progress percentage (0-100).
        detail: Detailed status message.
    """
    
    id: str
    label: str
    status: Literal["pending", "running", "completed", "skipped", "error"]
    progress: float = 0.0
    detail: str | None = None


class InstallProgress(BaseModel):
    """Overall installation progress.
    
    Aggregates progress across all installation stages.
    
    Attributes:
        state: Overall installation state.
        overall_progress: Weighted progress percentage.
        current_step: Current step description.
        message: Status message.
        error: Error message if failed.
        started_at: When installation started.
        updated_at: When progress was last updated.
        stages: List of individual stage progress.
    """
    
    state: Literal["idle", "running", "completed", "error"]
    overall_progress: float = 0.0
    current_step: str
    message: str | None = None
    error: str | None = None
    started_at: datetime | None = None
    updated_at: datetime
    stages: list[InstallStageProgress] = Field(default_factory=list)


class ModelDescriptor(BaseModel):
    """Information about an available model.
    
    Describes a model that can be used with the runtime.
    
    Attributes:
        id: Unique model identifier.
        name: Human-readable model name.
        filename: Model filename.
        size_hint: Human-readable size hint.
        local_path: Path to local file if installed.
        installed: Whether the model is installed locally.
    """
    
    id: str
    name: str
    filename: str
    size_hint: str
    local_path: str | None = None
    installed: bool


class AssetSourceInfo(BaseModel):
    """Information about an upstream asset source.
    
    Describes where assets are downloaded from and their licensing.
    
    Attributes:
        id: Unique source identifier.
        title: Human-readable source title.
        kind: Type of asset (runtime or model).
        source_url: URL to the source.
        license_name: License name (e.g., "MIT", "Apache-2.0").
        summary: Brief description of the source.
    """
    
    id: str
    title: str
    kind: Literal["runtime", "model"]
    source_url: str
    license_name: str
    summary: str


class RuntimeOverview(BaseModel):
    """Complete runtime overview for the UI.
    
    Aggregates all runtime-related information for display.
    
    Attributes:
        status: Current runtime status.
        config: Current runtime configuration.
        models: List of available models.
        install_progress: Installation progress information.
        sources: List of upstream asset sources.
    """
    
    status: RuntimeStatus
    config: RuntimeConfig
    models: list[ModelDescriptor] = Field(default_factory=list)
    install_progress: InstallProgress
    sources: list[AssetSourceInfo] = Field(default_factory=list)


class FileSelection
