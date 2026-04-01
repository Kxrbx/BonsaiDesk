from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _default_home() -> Path:
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
        if not self.database_name:
            self.database_name = _default_database_name(self.app_home)

    @property
    def database_path(self) -> Path:
        return self.app_home / self.database_name

    @property
    def runtime_dir(self) -> Path:
        return self.app_home / self.runtime_dir_name

    @property
    def runtime_bin_dir(self) -> Path:
        return self.runtime_dir / "bin"

    @property
    def runtime_pid_path(self) -> Path:
        return self.runtime_dir / "llama-server.pid"

    @property
    def runtime_meta_path(self) -> Path:
        return self.runtime_dir / "runtime.json"

    @property
    def models_dir(self) -> Path:
        return self.app_home / self.models_dir_name

    @property
    def logs_dir(self) -> Path:
        return self.app_home / self.logs_dir_name

    @property
    def runtime_log_path(self) -> Path:
        return self.logs_dir / "llama-server.log"


settings = Settings()
