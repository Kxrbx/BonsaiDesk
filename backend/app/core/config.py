"""Configuration management for Bonsai Desk.

This module handles all application configuration, including environment
variable parsing, path resolution, and backward compatibility with
legacy Prism Launcher installations.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _project_root() -> Path:
    """Get the project root directory.
    
    Returns:
        Path: The absolute path to the project root (3 levels up from this file).
    """
    return Path(__file__).resolve().parents[3]


def _default_home() -> Path:
    """Determine the default application home directory.
    
    Checks for environment variable overrides, then looks for existing
    directories in priority order:
    1. BONSAI_DESK_HOME environment variable
    2. PRISM_LAUNCHER_HOME environment variable (legacy)
    3. .bonsai-desk/ directory (if exists)
    4. .prism-launcher/ directory (legacy, if exists)
    5. .bonsai-desk/ (create new)
    
    Returns:
        Path: The resolved application home directory.
    """
    override = os.getenv("BONSAI_DESK_HOME") or os.getenv("PRISM_LAUNCHER_HOME")
    if override:
        return Path(override).expanduser().resolve()

    project_root = _project_root()
    preferred = project_root / ".bonsai-desk"
    legacy = project_root / ".prism-launcher"

    if preferred.exists():
        return preferred
    if legacy.exists():
        return legacy
    return preferred


def _default_database_name(app_home: Path) -> str:
    """Determine the database filename based on existing files.
    
    Maintains backward compatibility with legacy prism_launcher.db
    if it exists, otherwise uses the new bonsai_desk.db name.
    
    Args:
        app_home: The application home directory path.
        
    Returns:
        str: The database filename to use.
    """
    preferred = app_home / "bonsai_desk.db"
    legacy = app_home / "prism_launcher.db"

    if preferred.exists():
        return preferred.name
    if legacy.exists():
        return legacy.name
    if app_home.name == ".prism-launcher":
        return legacy.name
    return preferred.name


@dataclass(slots=True)
class Settings:
    """Application configuration settings.
    
    This dataclass holds all configuration values for Bonsai Desk,
    with sensible defaults and environment variable overrides.
    
    Attributes:
        app_name: Display name of the application.
        api_prefix: URL prefix for API routes.
        app_home: Base directory for application data.
        database_name: SQLite database filename.
        runtime_dir_name: Subdirectory name for runtime files.
        models_dir_name: Subdirectory name for model files.
        logs_dir_name: Subdirectory name for log files.
        model_repo_id: Hugging Face model repository ID.
        model_filename: Default model filename.
        bonsai_model_size: Model size identifier (e.g., "8B").
        model_download_url: URL for downloading the model.
        runtime_zip_url: Optional custom runtime archive URL.
        runtime_binary_override: Optional path to custom runtime binary.
        prism_llama_release_tag: GitHub release tag for runtime.
        prism_llama_asset_suffix: Asset filename suffix.
        prism_llama_release_base: Base URL for GitHub releases.
        runtime_host: Host address for llama-server.
        runtime_port: Port number for llama-server.
    """
    
    app_name: str = "Bonsai Desk"
    api_prefix: str = "/api"
    app_home: Path = _default_home()
    database_name: str = ""
    runtime_dir_name: str = "runtime"
    models_dir_name: str = "models"
    logs_dir_name: str = "logs"
    model_repo_id: str = "prism-ml/Bonsai-8B-gguf"
    model_filename: str = os.getenv("PRISM_MODEL_FILENAME", "Bonsai-8B.gguf")
    bonsai_model_size: str = os.getenv("PRISM_BONSAI_MODEL_SIZE", "8B")
    model_download_url: str = os.getenv(
        "PRISM_MODEL_URL",
        "https://huggingface.co/prism-ml/Bonsai-8B-gguf/resolve/main/Bonsai-8B.gguf?download=true",
    )
    runtime_zip_url: str | None = os.getenv("PRISM_LLAMA_CPP_ZIP_URL")
    runtime_binary_override: str | None = os.getenv("PRISM_LLAMA_SERVER_PATH")
    prism_llama_release_tag: str = os.getenv("PRISM_LLAMA_RELEASE_TAG", "prism-b8194-1179bfc")
    prism_llama_asset_suffix: str = os.getenv("PRISM_LLAMA_ASSET_SUFFIX", "1179bfc")
    prism_llama_release_base: str = os.getenv(
        "PRISM_LLAMA_RELEASE_BASE",
        "https://github.com/PrismML-Eng/llama.cpp/releases/download",
    )
    runtime_host: str = os.getenv("PRISM_RUNTIME_HOST", "127.0.0.1")
    runtime_port: int = int(os.getenv("PRISM_RUNTIME_PORT", "8080"))

    def __post_init__(self) -> None:
        """Initialize computed fields after dataclass construction."""
        if not self.database_name:
            self.database_name = _default_database_name(self.app_home)

    @property
    def database_path(self) -> Path:
        """Get the full path to the SQLite database.
        
        Returns:
            Path: Absolute path to the database file.
        """
        return self.app_home / self.database_name

    @property
    def runtime_dir(self) -> Path:
        """Get the runtime directory path.
        
        Returns:
            Path: Absolute path to the runtime directory.
        """
        return self.app_home / self.runtime_dir_name

    @property
    def runtime_bin_dir(self) -> Path:
        """Get the runtime binaries directory path.
        
        Returns:
            Path: Absolute path to the runtime bin directory.
        """
        return self.runtime_dir / "bin"

    @property
    def runtime_pid_path(self) -> Path:
        """Get the runtime PID file path.
        
        Returns:
            Path: Absolute path to the PID file.
        """
        return self.runtime_dir / "llama-server.pid"

    @property
    def runtime_meta_path(self) -> Path:
        """Get the runtime metadata file path.
        
        Returns:
            Path: Absolute path to the runtime metadata JSON file.
        """
        return self.runtime_dir / "runtime.json"

    @property
    def models_dir(self) -> Path:
        """Get the models directory path.
        
        Returns:
            Path: Absolute path to the models directory.
        """
        return self.app_home / self.models_dir_name

    @property
    def logs_dir(self) -> Path:
        """Get the logs directory path.
        
        Returns:
            Path: Absolute path to the logs directory.
        """
        return self.app_home / self.logs_dir_name

    @property
    def runtime_log_path(self) -> Path:
        """Get the runtime log file path.
        
        Returns:
            Path: Absolute path to the llama-server log file.
        """
        return self.logs_dir / "llama-server.log"


# Global settings instance
settings = Settings()
