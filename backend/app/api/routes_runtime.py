from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.schemas import (
    FileSelectionResult,
    InstallProgress,
    RuntimeConfig,
    RuntimeOverview,
    RuntimeStatus,
    UseExistingAssetsRequest,
)
from app.services import runtime_manager

router = APIRouter(prefix="/runtime", tags=["runtime"])


@router.get("/status", response_model=RuntimeStatus)
async def runtime_status() -> RuntimeStatus:
    return await runtime_manager.get_status()


@router.get("/overview", response_model=RuntimeOverview)
async def runtime_overview() -> RuntimeOverview:
    config = runtime_manager.get_runtime_config()
    return RuntimeOverview(
        status=await runtime_manager.get_status(),
        config=config,
        models=[runtime_manager.get_model_descriptor()],
        install_progress=runtime_manager.get_install_progress(),
        sources=runtime_manager.get_asset_sources(),
    )


@router.get("/config", response_model=RuntimeConfig)
def get_runtime_config() -> RuntimeConfig:
    return runtime_manager.get_runtime_config()


@router.put("/config", response_model=RuntimeConfig)
def update_runtime_config(config: RuntimeConfig) -> RuntimeConfig:
    return runtime_manager.update_runtime_config(config)


@router.get("/install-progress", response_model=InstallProgress)
def get_install_progress() -> InstallProgress:
    return runtime_manager.get_install_progress()


@router.post("/browse-binary", response_model=FileSelectionResult)
def browse_runtime_binary() -> FileSelectionResult:
    try:
        return runtime_manager.browse_runtime_binary()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/browse-model", response_model=FileSelectionResult)
def browse_model() -> FileSelectionResult:
    try:
        return runtime_manager.browse_model_file()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/use-existing-assets", response_model=RuntimeOverview)
async def use_existing_assets(payload: UseExistingAssetsRequest) -> RuntimeOverview:
    try:
        config = runtime_manager.use_existing_assets(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return RuntimeOverview(
        status=await runtime_manager.get_status(),
        config=config,
        models=[runtime_manager.get_model_descriptor()],
        install_progress=runtime_manager.get_install_progress(),
        sources=runtime_manager.get_asset_sources(),
    )


@router.post("/install", response_model=InstallProgress)
async def install_runtime() -> InstallProgress:
    try:
        return runtime_manager.install()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/start", response_model=RuntimeStatus)
async def start_runtime() -> RuntimeStatus:
    try:
        return await runtime_manager.start()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/stop", response_model=RuntimeStatus)
async def stop_runtime() -> RuntimeStatus:
    return await runtime_manager.stop()


@router.post("/restart", response_model=RuntimeStatus)
async def restart_runtime() -> RuntimeStatus:
    try:
        return await runtime_manager.restart()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/logs", response_model=list[str])
def get_runtime_logs() -> list[str]:
    return runtime_manager.tail_logs()
