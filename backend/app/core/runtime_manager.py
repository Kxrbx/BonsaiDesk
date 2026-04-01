from __future__ import annotations

import atexit
import asyncio
import ctypes
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import threading
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import urlopen

import httpx

if os.name == "nt":
    from ctypes import wintypes

from app.core.config import settings
from app.core.schemas import (
    AssetSourceInfo,
    FileSelectionResult,
    InstallProgress,
    InstallStageProgress,
    ModelDescriptor,
    RuntimeConfig,
    RuntimeOverview,
    RuntimeStatus,
    UseExistingAssetsRequest,
)
from app.db.storage import Storage


if os.name == "nt":
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000
    JOB_OBJECT_EXTENDED_LIMIT_INFORMATION = 9

    class IO_COUNTERS(ctypes.Structure):
        _fields_ = [
            ("ReadOperationCount", ctypes.c_uint64),
            ("WriteOperationCount", ctypes.c_uint64),
            ("OtherOperationCount", ctypes.c_uint64),
            ("ReadTransferCount", ctypes.c_uint64),
            ("WriteTransferCount", ctypes.c_uint64),
            ("OtherTransferCount", ctypes.c_uint64),
        ]

    class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("PerProcessUserTimeLimit", ctypes.c_int64),
            ("PerJobUserTimeLimit", ctypes.c_int64),
            ("LimitFlags", wintypes.DWORD),
            ("MinimumWorkingSetSize", ctypes.c_size_t),
            ("MaximumWorkingSetSize", ctypes.c_size_t),
            ("ActiveProcessLimit", wintypes.DWORD),
            ("Affinity", ctypes.c_size_t),
            ("PriorityClass", wintypes.DWORD),
            ("SchedulingClass", wintypes.DWORD),
        ]

    class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
            ("IoInfo", IO_COUNTERS),
            ("ProcessMemoryLimit", ctypes.c_size_t),
            ("JobMemoryLimit", ctypes.c_size_t),
            ("PeakProcessMemoryUsed", ctypes.c_size_t),
            ("PeakJobMemoryUsed", ctypes.c_size_t),
        ]


class RuntimeManager:
    def __init__(self, storage: Storage) -> None:
        self.storage = storage
        self._install_lock = threading.Lock()
        self._install_thread: threading.Thread | None = None
        self._install_progress = self._new_install_progress()
        self._runtime_log_handle: Any | None = None
        self._job_handle: int | None = None
        self._ensure_directories()
        atexit.register(self._shutdown_on_exit)

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    def _new_install_progress(self) -> InstallProgress:
        now = self._now()
        return InstallProgress(
            state="idle",
            overall_progress=0.0,
            current_step="Waiting to install",
            message="Runtime and model are not installed yet.",
            updated_at=now,
            stages=[
                InstallStageProgress(
                    id="runtime_package",
                    label="Runtime package",
                    status="pending",
                    progress=0.0,
                    detail="Download or detect llama-server build",
                ),
                InstallStageProgress(
                    id="runtime_extract",
                    label="Runtime extraction",
                    status="pending",
                    progress=0.0,
                    detail="Unpack and verify llama-server.exe",
                ),
                InstallStageProgress(
                    id="model_download",
                    label="Model download",
                    status="pending",
                    progress=0.0,
                    detail="Download Bonsai-8B GGUF",
                ),
                InstallStageProgress(
                    id="finalize",
                    label="Finalize",
                    status="pending",
                    progress=0.0,
                    detail="Refresh status and finish setup",
                ),
            ],
        )

    def _set_install_progress(self, progress: InstallProgress) -> None:
        with self._install_lock:
            self._install_progress = progress

    def get_install_progress(self) -> InstallProgress:
        with self._install_lock:
            progress = self._install_progress.model_copy(deep=True)

        if progress.state == "idle" and self._find_local_binary() and self._find_local_model():
            progress.state = "completed"
            progress.current_step = "Already installed"
            progress.message = "Runtime and model are already available locally."
            progress.overall_progress = 100.0
            progress.started_at = progress.started_at or self._now()
            progress.updated_at = self._now()
            for stage in progress.stages:
                stage.status = "completed"
                stage.progress = 100.0
                if stage.id == "runtime_package":
                    stage.detail = "Prism runtime already present"
                elif stage.id == "runtime_extract":
                    stage.detail = "Runtime binaries already unpacked"
                elif stage.id == "model_download":
                    stage.detail = "Bonsai model already downloaded"
                elif stage.id == "finalize":
                    stage.detail = "Setup already complete"
            self._set_install_progress(progress)
            return progress

        return progress

    def _update_install_progress(
        self,
        *,
        state: str | None = None,
        current_step: str | None = None,
        message: str | None = None,
        error: str | None = None,
        stage_id: str | None = None,
        stage_status: str | None = None,
        stage_progress: float | None = None,
        stage_detail: str | None = None,
    ) -> InstallProgress:
        with self._install_lock:
            progress = self._install_progress.model_copy(deep=True)
            if state is not None:
                progress.state = state
            if current_step is not None:
                progress.current_step = current_step
            if message is not None:
                progress.message = message
            if error is not None:
                progress.error = error
            if progress.state == "running" and progress.started_at is None:
                progress.started_at = self._now()

            if stage_id is not None:
                for stage in progress.stages:
                    if stage.id != stage_id:
                        continue
                    if stage_status is not None:
                        stage.status = stage_status
                    if stage_progress is not None:
                        stage.progress = max(0.0, min(100.0, stage_progress))
                    if stage_detail is not None:
                        stage.detail = stage_detail
                    break

            weights = {
                "runtime_package": 0.28,
                "runtime_extract": 0.12,
                "model_download": 0.52,
                "finalize": 0.08,
            }
            progress.overall_progress = round(
                sum(stage.progress * weights.get(stage.id, 0.0) for stage in progress.stages),
                1,
            )
            progress.updated_at = self._now()
            self._install_progress = progress
            return progress

    def _ensure_directories(self) -> None:
        settings.app_home.mkdir(parents=True, exist_ok=True)
        settings.runtime_dir.mkdir(parents=True, exist_ok=True)
        settings.runtime_bin_dir.mkdir(parents=True, exist_ok=True)
        settings.models_dir.mkdir(parents=True, exist_ok=True)
        settings.logs_dir.mkdir(parents=True, exist_ok=True)

    def get_model_descriptor(self) -> ModelDescriptor:
        config = self.get_runtime_config()
        model_path = self._find_local_model(config)
        return ModelDescriptor(
            id=settings.model_repo_id,
            name=Path(config.model_filename).stem.replace("-", " "),
            filename=config.model_filename,
            size_hint="1.16 GB",
            local_path=str(model_path) if model_path else None,
            installed=bool(model_path),
        )

    def get_asset_sources(self) -> list[AssetSourceInfo]:
        return [
            AssetSourceInfo(
                id="bonsai-model",
                title="Bonsai 8B GGUF",
                kind="model",
                source_url="https://huggingface.co/prism-ml/Bonsai-8B-gguf",
                license_name="Apache-2.0",
                summary="Official Bonsai GGUF model source on Hugging Face.",
            ),
            AssetSourceInfo(
                id="bonsai-demo",
                title="Prism Bonsai Demo",
                kind="runtime",
                source_url="https://github.com/PrismML-Eng/Bonsai-demo",
                license_name="Apache-2.0",
                summary="Official demo flow used as the default runtime installation source.",
            ),
            AssetSourceInfo(
                id="prism-llama",
                title="Prism llama.cpp fork",
                kind="runtime",
                source_url="https://github.com/PrismML-Eng/llama.cpp",
                license_name="MIT",
                summary="Prism-compatible llama.cpp fork that provides the local server binary.",
            ),
        ]

    def get_runtime_config(self) -> RuntimeConfig:
        config = self.storage.get_runtime_config()
        config.host = settings.runtime_host
        config.port = settings.runtime_port
        if not config.model_filename:
            config.model_filename = settings.model_filename
        return config

    def update_runtime_config(self, config: RuntimeConfig) -> RuntimeConfig:
        config.host = settings.runtime_host
        config.port = settings.runtime_port
        if config.model_file_path:
            config.model_filename = Path(config.model_file_path).name
        return self.storage.save_runtime_config(config)

    def _binary_override_path(self) -> Path | None:
        if not settings.runtime_binary_override:
            return None
        candidate = Path(settings.runtime_binary_override).expanduser()
        return candidate if candidate.exists() else None

    def _config_binary_path(self, config: RuntimeConfig | None = None) -> Path | None:
        runtime_config = config or self.get_runtime_config()
        if not runtime_config.runtime_binary_path:
            return None
        candidate = Path(runtime_config.runtime_binary_path).expanduser()
        return candidate.resolve() if candidate.exists() else None

    def _config_model_path(self, config: RuntimeConfig | None = None) -> Path | None:
        runtime_config = config or self.get_runtime_config()
        if not runtime_config.model_file_path:
            return None
        candidate = Path(runtime_config.model_file_path).expanduser()
        return candidate.resolve() if candidate.exists() else None

    def _detect_cuda_tag(self) -> str:
        candidates = [
            shutil.which("nvidia-smi"),
            str(Path(os.environ.get("ProgramFiles", "")) / "NVIDIA Corporation" / "NVSMI" / "nvidia-smi.exe"),
            str(Path(os.environ.get("SystemRoot", "C:\\Windows")) / "System32" / "nvidia-smi.exe"),
        ]
        for candidate in candidates:
            if not candidate:
                continue
            path = Path(candidate)
            if not path.exists():
                continue
            try:
                result = subprocess.run(
                    [str(path)],
                    capture_output=True,
                    text=True,
                    check=False,
                )
            except OSError:
                continue
            match = re.search(r"CUDA Version:\s+(\d+)\.(\d+)", result.stdout + result.stderr)
            if not match:
                continue
            major = int(match.group(1))
            minor = int(match.group(2))
            if major >= 13:
                return "13.1"
            if major == 12 and minor >= 4:
                return "12.4"
        return "12.4"

    def _release_base_url(self) -> str:
        return f"{settings.prism_llama_release_base.rstrip('/')}/{settings.prism_llama_release_tag}"

    def _prism_runtime_asset_urls(self) -> tuple[str, str]:
        cuda_tag = self._detect_cuda_tag()
        suffix = settings.prism_llama_asset_suffix
        base = self._release_base_url()
        runtime_asset = f"llama-prism-b1-{suffix}-bin-win-cuda-{cuda_tag}-x64.zip"
        dll_asset = f"cudart-llama-bin-win-cuda-{cuda_tag}-x64.zip"
        return (f"{base}/{runtime_asset}", f"{base}/{dll_asset}")

    def _binary_from_path(self) -> Path | None:
        candidates = [shutil.which("llama-server.exe"), shutil.which("llama-server")]
        for candidate in candidates:
            if candidate:
                return Path(candidate).resolve()
        return None

    @staticmethod
    def _is_runtime_binary(path: Path) -> bool:
        lowered = path.name.lower()
        return path.is_file() and lowered.endswith(".exe") and "llama" in lowered and "server" in lowered

    def _search_runtime_tree(self, root: Path) -> Path | None:
        if not root.exists():
            return None

        direct_candidates = [
            root / "llama-server.exe",
            root / "Llama-server.exe",
            root / "bin" / "llama-server.exe",
            root / "build" / "bin" / "Release" / "llama-server.exe",
        ]
        for candidate in direct_candidates:
            if candidate.exists():
                return candidate.resolve()

        for candidate in root.rglob("*.exe"):
            if self._is_runtime_binary(candidate):
                return candidate.resolve()
        return None

    def _managed_binary(self) -> Path | None:
        return self._search_runtime_tree(settings.runtime_bin_dir)

    def _find_local_binary(self, config: RuntimeConfig | None = None) -> Path | None:
        configured = self._config_binary_path(config)
        if configured:
            return configured
        override = self._binary_override_path()
        if override:
            return override
        managed_binary = self._managed_binary()
        if managed_binary:
            return managed_binary
        path_binary = self._binary_from_path()
        if path_binary:
            return path_binary
        return None

    def _model_path(self, config: RuntimeConfig | None = None) -> Path:
        runtime_config = config or self.get_runtime_config()
        return settings.models_dir / runtime_config.model_filename

    def _find_local_model(self, config: RuntimeConfig | None = None) -> Path | None:
        runtime_config = config or self.get_runtime_config()
        configured = self._config_model_path(runtime_config)
        if configured:
            return configured
        direct_candidates = [
            self._model_path(runtime_config),
            settings.models_dir / "gguf" / settings.bonsai_model_size / runtime_config.model_filename,
        ]
        for candidate in direct_candidates:
            if candidate.exists():
                return candidate.resolve()
        return None

    def _binary_source(self, config: RuntimeConfig | None = None) -> str | None:
        if self._config_binary_path(config):
            return "linked-local"
        override = self._binary_override_path()
        if override:
            return "env-override"
        if self._managed_binary():
            if settings.runtime_meta_path.exists():
                try:
                    payload = json.loads(settings.runtime_meta_path.read_text(encoding="utf-8"))
                except json.JSONDecodeError:
                    return "managed-download"
                source = payload.get("source")
                if source in {"official-bonsai-demo", "configured-zip"}:
                    return "managed-download"
            return "managed-runtime"
        if self._binary_from_path():
            return "system-path"
        return None

    def _model_source(self, config: RuntimeConfig | None = None) -> str | None:
        if self._config_model_path(config):
            return "linked-local"
        if self._find_local_model(config):
            return "managed-download"
        return None

    def _is_port_open(self, host: str, port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(0.5)
            return sock.connect_ex((host, port)) == 0

    def _pid(self) -> int | None:
        if not settings.runtime_pid_path.exists():
            return None
        try:
            return int(settings.runtime_pid_path.read_text(encoding="utf-8").strip())
        except ValueError:
            return None

    def _process_alive(self, pid: int | None) -> bool:
        if not pid:
            return False
        process = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}"],
            capture_output=True,
            text=True,
            check=False,
        )
        return str(pid) in process.stdout

    def _runtime_source(self, config: RuntimeConfig | None = None) -> str | None:
        return self._binary_source(config)

    def _close_runtime_log_handle(self) -> None:
        if self._runtime_log_handle and not self._runtime_log_handle.closed:
            self._runtime_log_handle.close()
        self._runtime_log_handle = None

    def _shutdown_on_exit(self) -> None:
        pid = self._pid()
        if pid and self._process_alive(pid):
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True,
                text=True,
                check=False,
            )
        if settings.runtime_pid_path.exists():
            settings.runtime_pid_path.unlink(missing_ok=True)
        self._close_runtime_log_handle()

    def _ensure_process_job(self) -> int | None:
        if os.name != "nt":
            return None
        if self._job_handle:
            return self._job_handle

        kernel32 = ctypes.windll.kernel32
        kernel32.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
        kernel32.CreateJobObjectW.restype = wintypes.HANDLE
        kernel32.SetInformationJobObject.argtypes = [
            wintypes.HANDLE,
            wintypes.DWORD,
            ctypes.c_void_p,
            wintypes.DWORD,
        ]
        kernel32.SetInformationJobObject.restype = wintypes.BOOL
        kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
        kernel32.CloseHandle.restype = wintypes.BOOL
        job_handle = kernel32.CreateJobObjectW(None, None)
        if not job_handle:
            return None

        info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        result = kernel32.SetInformationJobObject(
            job_handle,
            JOB_OBJECT_EXTENDED_LIMIT_INFORMATION,
            ctypes.byref(info),
            ctypes.sizeof(info),
        )
        if not result:
            kernel32.CloseHandle(job_handle)
            return None

        self._job_handle = int(job_handle)
        return self._job_handle

    def _bind_process_to_backend_lifecycle(self, process: subprocess.Popen[Any]) -> None:
        job_handle = self._ensure_process_job()
        if os.name != "nt" or not job_handle:
            return

        kernel32 = ctypes.windll.kernel32
        kernel32.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
        kernel32.AssignProcessToJobObject.restype = wintypes.BOOL
        process_handle = wintypes.HANDLE(process._handle)
        kernel32.AssignProcessToJobObject(wintypes.HANDLE(job_handle), process_handle)

    async def check_health(self) -> bool:
        config = self.get_runtime_config()
        base_url = f"http://{config.host}:{config.port}"
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{base_url}/health")
                if response.status_code == 200:
                    return True
                models_response = await client.get(f"{base_url}/v1/models")
                return models_response.status_code == 200
        except httpx.HTTPError:
            return False

    async def get_status(self) -> RuntimeStatus:
        config = self.get_runtime_config()
        binary_path = self._find_local_binary(config)
        model_path = self._find_local_model(config)
        pid = self._pid()
        running = self._process_alive(pid) or self._is_port_open(config.host, config.port)
        ready = running and await self.check_health()

        install_message = None
        last_error = None
        if config.runtime_binary_path and not binary_path:
            install_message = "The linked runtime file is no longer available. Pick a new llama-server.exe or use the official download."
        elif config.model_file_path and not model_path:
            install_message = "The linked model file is no longer available. Pick a new GGUF file or download the official model."
        elif not binary_path:
            install_message = (
                "No usable runtime was found yet. Download the official Prism runtime or link an existing "
                "llama-server.exe from this PC."
            )
        elif not model_path:
            install_message = "No Bonsai GGUF model is linked yet. Download one or point Bonsai Desk to an existing .gguf file."
        elif running and not ready:
            last_error = "llama-server is running but not yet healthy."

        return RuntimeStatus(
            installed=bool(binary_path and model_path),
            running=running,
            ready=ready,
            binary_path=str(binary_path) if binary_path else None,
            model_path=str(model_path) if model_path else None,
            pid=pid if self._process_alive(pid) else None,
            host=config.host,
            port=config.port,
            health_url=f"http://{config.host}:{config.port}",
            runtime_source=self._runtime_source(config),
            model_source=self._model_source(config),
            install_message=install_message,
            last_error=last_error,
            config=config,
        )

    def _write_runtime_meta(self, source: str, extra: dict[str, Any] | None = None) -> None:
        payload = {"source": source, "updated_at": time.time(), **(extra or {})}
        settings.runtime_meta_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    @staticmethod
    def _quote_powershell(value: str) -> str:
        return value.replace("'", "''")

    def _open_windows_file_dialog(self, *, title: str, filter_value: str, initial_directory: Path | None = None) -> str | None:
        if platform.system() != "Windows":
            raise RuntimeError("Native file browsing is only available on Windows in this build.")

        ps = shutil.which("powershell.exe") or "C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
        command_parts = [
            "Add-Type -AssemblyName System.Windows.Forms",
            "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
            f"$dialog.Title = '{self._quote_powershell(title)}'",
            f"$dialog.Filter = '{self._quote_powershell(filter_value)}'",
            "$dialog.CheckFileExists = $true",
            "$dialog.Multiselect = $false",
        ]
        if initial_directory:
            command_parts.append(
                f"$dialog.InitialDirectory = '{self._quote_powershell(str(initial_directory))}'"
            )
        command_parts.append(
            "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.FileName }"
        )
        result = subprocess.run(
            [ps, "-NoProfile", "-STA", "-Command", "; ".join(command_parts)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise RuntimeError("The native file picker could not be opened on this machine.")
        selected = result.stdout.strip()
        return selected or None

    def browse_runtime_binary(self) -> FileSelectionResult:
        selected = self._open_windows_file_dialog(
            title="Select a Prism-compatible llama-server.exe",
            filter_value="llama-server.exe|llama-server.exe|Executables (*.exe)|*.exe|All files (*.*)|*.*",
            initial_directory=settings.runtime_dir,
        )
        return FileSelectionResult(path=selected)

    def browse_model_file(self) -> FileSelectionResult:
        selected = self._open_windows_file_dialog(
            title="Select a Bonsai GGUF model",
            filter_value="GGUF models (*.gguf)|*.gguf|All files (*.*)|*.*",
            initial_directory=settings.models_dir,
        )
        return FileSelectionResult(path=selected)

    def _validate_runtime_binary_path(self, raw_path: str) -> Path:
        candidate = Path(raw_path).expanduser()
        if not candidate.exists():
            raise RuntimeError("The selected runtime path does not exist.")
        if not self._is_runtime_binary(candidate):
            raise RuntimeError("Select a Prism-compatible llama-server.exe file.")
        return candidate.resolve()

    def _validate_model_file_path(self, raw_path: str) -> Path:
        candidate = Path(raw_path).expanduser()
        if not candidate.exists():
            raise RuntimeError("The selected model path does not exist.")
        if not candidate.is_file() or candidate.suffix.lower() != ".gguf":
            raise RuntimeError("Select a valid GGUF model file.")
        return candidate.resolve()

    def use_existing_assets(self, payload: UseExistingAssetsRequest) -> RuntimeConfig:
        config = self.get_runtime_config()

        if payload.runtime_binary_path is not None:
            runtime_path = payload.runtime_binary_path.strip()
            config.runtime_binary_path = str(self._validate_runtime_binary_path(runtime_path)) if runtime_path else None

        if payload.model_file_path is not None:
            model_path = payload.model_file_path.strip()
            if model_path:
                resolved_model_path = self._validate_model_file_path(model_path)
                config.model_file_path = str(resolved_model_path)
                config.model_filename = resolved_model_path.name
            else:
                config.model_file_path = None

        return self.update_runtime_config(config)

    def _download_file(
        self,
        url: str,
        destination: Path,
        stage_id: str | None = None,
        label: str | None = None,
    ) -> None:
        destination.parent.mkdir(parents=True, exist_ok=True)
        with urlopen(url) as response, destination.open("wb") as handle:
            total = response.headers.get("Content-Length")
            total_bytes = int(total) if total and total.isdigit() else 0
            downloaded = 0
            chunk_size = 1024 * 256
            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                handle.write(chunk)
                downloaded += len(chunk)
                if stage_id:
                    if total_bytes > 0:
                        percent = downloaded * 100 / total_bytes
                        detail = f"{label or 'Downloading'} {downloaded // (1024 * 1024)} / {total_bytes // (1024 * 1024)} MB"
                    else:
                        percent = 15.0 + min(downloaded / (1024 * 1024), 80.0)
                        detail = f"{label or 'Downloading'} {downloaded // (1024 * 1024)} MB"
                    self._update_install_progress(
                        current_step=label or "Downloading",
                        stage_id=stage_id,
                        stage_status="running",
                        stage_progress=percent,
                        stage_detail=detail,
                    )

    def _download_runtime_zip(self) -> Path:
        if settings.runtime_zip_url:
            url = settings.runtime_zip_url
            source = "configured-zip"
        else:
            url, _dll_url = self._prism_runtime_asset_urls()
            source = "official-bonsai-demo"

        archive_path = settings.runtime_dir / "llama-runtime.zip"
        self._download_file(url, archive_path, stage_id="runtime_package", label="Downloading runtime")
        self._write_runtime_meta(source=source, extra={"archive_url": url})
        return archive_path

    def _download_cuda_dlls(self) -> None:
        if settings.runtime_zip_url:
            return
        _, dll_url = self._prism_runtime_asset_urls()
        dll_archive_path = settings.runtime_dir / "llama-cuda-runtime.zip"
        try:
            self._download_file(
                dll_url,
                dll_archive_path,
                stage_id="runtime_extract",
                label="Downloading CUDA runtime",
            )
            with zipfile.ZipFile(dll_archive_path, "r") as archive:
                archive.extractall(settings.runtime_bin_dir)
        except Exception:
            self._update_install_progress(
                stage_id="runtime_extract",
                stage_status="running",
                stage_detail="Runtime installed; CUDA DLL sidecar download skipped",
            )

    def _extract_runtime_zip(self, archive_path: Path) -> Path:
        self._update_install_progress(
            current_step="Extracting runtime",
            stage_id="runtime_extract",
            stage_status="running",
            stage_progress=15.0,
            stage_detail="Opening runtime archive",
        )
        with zipfile.ZipFile(archive_path, "r") as archive:
            members = archive.namelist()
            total_members = max(len(members), 1)
            for index, member in enumerate(members, start=1):
                archive.extract(member, settings.runtime_bin_dir)
                self._update_install_progress(
                    stage_id="runtime_extract",
                    stage_status="running",
                    stage_progress=index * 100 / total_members,
                    stage_detail=f"Extracting {index}/{total_members} files",
                )
        binary_path = self._search_runtime_tree(settings.runtime_bin_dir)
        if not binary_path:
            extracted_executables = sorted(
                candidate.name
                for candidate in settings.runtime_bin_dir.rglob("*.exe")
            )
            sample = ", ".join(extracted_executables[:8]) if extracted_executables else "no .exe files found"
            raise RuntimeError(
                "The runtime archive does not contain a usable llama-server executable. "
                "Configure PRISM_LLAMA_CPP_ZIP_URL with a Prism-compatible runtime zip or "
                f"set PRISM_LLAMA_SERVER_PATH directly. Archive contents: {sample}."
            )
        return binary_path

    def _run_install(self) -> None:
        self._ensure_directories()
        progress = self._new_install_progress()
        progress.state = "running"
        progress.current_step = "Preparing installation"
        progress.message = "Checking local cache and existing runtime assets."
        progress.started_at = self._now()
        progress.updated_at = self._now()
        self._set_install_progress(progress)

        try:
            binary_path = self._find_local_binary()
            if binary_path:
                self._update_install_progress(
                    current_step="Runtime already available",
                    stage_id="runtime_package",
                    stage_status="completed",
                    stage_progress=100.0,
                    stage_detail="llama-server.exe already present",
                )
                self._update_install_progress(
                    stage_id="runtime_extract",
                    stage_status="skipped",
                    stage_progress=100.0,
                    stage_detail="Extraction skipped because runtime is already unpacked",
                )
            elif self._binary_override_path():
                self._write_runtime_meta(source="external-binary")
                self._update_install_progress(
                    current_step="Using external runtime",
                    stage_id="runtime_package",
                    stage_status="completed",
                    stage_progress=100.0,
                    stage_detail="Using PRISM_LLAMA_SERVER_PATH override",
                )
                self._update_install_progress(
                    stage_id="runtime_extract",
                    stage_status="skipped",
                    stage_progress=100.0,
                    stage_detail="Extraction skipped for external runtime",
                )
            else:
                archive_path = self._download_runtime_zip()
                self._update_install_progress(
                    stage_id="runtime_package",
                    stage_status="completed",
                    stage_progress=100.0,
                    stage_detail=f"Saved runtime archive to {archive_path.name}",
                )
                binary_path = self._extract_runtime_zip(archive_path)
                self._download_cuda_dlls()
                self._update_install_progress(
                    stage_id="runtime_extract",
                    stage_status="completed",
                    stage_progress=100.0,
                    stage_detail=f"Verified {binary_path.name}",
                )

            model_path = self._find_local_model()
            if model_path:
                self._update_install_progress(
                    current_step="Model already available",
                    stage_id="model_download",
                    stage_status="completed",
                    stage_progress=100.0,
                    stage_detail=f"Using cached {model_path.name}",
                )
            else:
                target_model_path = self._model_path()
                self._update_install_progress(
                    current_step="Downloading Bonsai model",
                    stage_id="model_download",
                    stage_status="running",
                    stage_progress=2.0,
                    stage_detail="Preparing model download",
                )
                self._download_file(
                    settings.model_download_url,
                    target_model_path,
                    stage_id="model_download",
                    label="Downloading Bonsai model",
                )
                self._update_install_progress(
                    stage_id="model_download",
                    stage_status="completed",
                    stage_progress=100.0,
                    stage_detail=f"Saved {target_model_path.name}",
                )

            self._update_install_progress(
                current_step="Finalizing setup",
                stage_id="finalize",
                stage_status="running",
                stage_progress=55.0,
                stage_detail="Refreshing runtime status",
            )
            self._update_install_progress(
                state="completed",
                current_step="Installation complete",
                message="Runtime and model are ready. You can start the local server now.",
                stage_id="finalize",
                stage_status="completed",
                stage_progress=100.0,
                stage_detail="Setup finished successfully",
                error=None,
            )
        except Exception as exc:  # noqa: BLE001
            current = self.get_install_progress()
            failing_stage_id = next(
                (stage.id for stage in current.stages if stage.status == "running"),
                "finalize",
            )
            self._update_install_progress(
                state="error",
                current_step="Installation failed",
                message="The install process stopped before completion.",
                error=str(exc),
                stage_id=failing_stage_id,
                stage_status="error",
                stage_detail=str(exc),
            )
        finally:
            with self._install_lock:
                self._install_thread = None

    def install(self) -> InstallProgress:
        with self._install_lock:
            if self._install_thread and self._install_thread.is_alive():
                return self._install_progress.model_copy(deep=True)

            if self._find_local_binary() and self._find_local_model():
                completed = self._new_install_progress()
                completed.state = "completed"
                completed.current_step = "Already installed"
                completed.message = "Runtime and model are already available locally."
                completed.started_at = self._now()
                completed.updated_at = self._now()
                for stage in completed.stages:
                    stage.status = "completed"
                    stage.progress = 100.0
                completed.overall_progress = 100.0
                self._install_progress = completed
                return completed.model_copy(deep=True)

            self._install_progress = self._new_install_progress()
            self._install_progress.state = "running"
            self._install_progress.current_step = "Preparing installation"
            self._install_progress.message = "Checking local cache and existing runtime assets."
            self._install_progress.overall_progress = 1.0
            self._install_progress.started_at = self._now()
            self._install_progress.updated_at = self._now()
            self._install_thread = threading.Thread(target=self._run_install, daemon=True)
            self._install_thread.start()
            return self._install_progress.model_copy(deep=True)

    def _command(self, config: RuntimeConfig) -> list[str]:
        binary_path = self._find_local_binary(config)
        if not binary_path:
            raise RuntimeError("llama-server.exe is not installed.")
        model_path = self._find_local_model(config)
        if not model_path:
            raise RuntimeError("No usable GGUF model is configured.")

        return [
            str(binary_path),
            "-m",
            str(model_path),
            "--host",
            config.host,
            "--port",
            str(config.port),
            "--temp",
            str(config.temperature),
            "--top-p",
            str(config.top_p),
            "--top-k",
            str(config.top_k),
            "--min-p",
            str(config.min_p),
            "-c",
            str(config.ctx_size),
            "-ngl",
            str(config.gpu_layers),
            "-t",
            str(config.threads),
            "--reasoning-budget",
            str(config.reasoning_budget),
            "--reasoning-format",
            config.reasoning_format or "none",
            "--chat-template-kwargs",
            json.dumps({"enable_thinking": config.enable_thinking}),
        ]

    async def start(self) -> RuntimeStatus:
        status = await self.get_status()
        if status.ready:
            return status
        if status.running:
            if status.pid and self._process_alive(status.pid):
                for _ in range(20):
                    if await self.check_health():
                        return await self.get_status()
                    await asyncio.sleep(1)
                raise RuntimeError(
                    "An existing llama-server process is already running but did not become healthy. "
                    "Check the runtime logs or stop it before starting again."
                )
            raise RuntimeError(
                f"Port {status.host}:{status.port} is already in use by another process. "
                "Stop the conflicting process or change the configured runtime port."
            )

        command = self._command(status.config)
        self._close_runtime_log_handle()
        self._runtime_log_handle = settings.runtime_log_path.open("a", encoding="utf-8")
        process = subprocess.Popen(
            command,
            cwd=str(Path(command[0]).parent),
            stdout=self._runtime_log_handle,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        self._bind_process_to_backend_lifecycle(process)
        settings.runtime_pid_path.write_text(str(process.pid), encoding="utf-8")

        for _ in range(20):
            if await self.check_health():
                return await self.get_status()
            if process.poll() is not None:
                break
            await asyncio.sleep(1)

        await self.stop()
        raise RuntimeError(
            "llama-server failed to become healthy. Check the runtime logs in the Runtime panel."
        )

    async def stop(self) -> RuntimeStatus:
        pid = self._pid()
        if pid and self._process_alive(pid):
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True,
                text=True,
                check=False,
            )
        if settings.runtime_pid_path.exists():
            settings.runtime_pid_path.unlink()
        self._close_runtime_log_handle()
        return await self.get_status()

    async def restart(self) -> RuntimeStatus:
        await self.stop()
        return await self.start()

    async def shutdown(self) -> None:
        try:
            await self.stop()
        except Exception:  # noqa: BLE001
            self._shutdown_on_exit()

    def tail_logs(self, max_lines: int = 200) -> list[str]:
        if not settings.runtime_log_path.exists():
            return []
        lines = settings.runtime_log_path.read_text(encoding="utf-8", errors="ignore").splitlines()
        return lines[-max_lines:]
