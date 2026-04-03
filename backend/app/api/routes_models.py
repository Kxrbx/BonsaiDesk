from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.schemas import InstallProgress, ModelDescriptor, RuntimeOverview, SelectModelRequest
from app.services import runtime_manager

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=list[ModelDescriptor])
def list_models() -> list[ModelDescriptor]:
    return runtime_manager.get_model_descriptors()


@router.post("/select", response_model=RuntimeOverview)
async def select_model(payload: SelectModelRequest) -> RuntimeOverview:
    try:
        config = runtime_manager.select_model_variant(payload.variant)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return RuntimeOverview(
        status=await runtime_manager.get_status(),
        config=config,
        models=runtime_manager.get_model_descriptors(),
        install_progress=runtime_manager.get_install_progress(),
        sources=runtime_manager.get_asset_sources(),
        diagnostics=await runtime_manager.get_diagnostics(),
    )


@router.post("/install", response_model=InstallProgress)
def install_model(payload: SelectModelRequest) -> InstallProgress:
    try:
        runtime_manager.select_model_variant(payload.variant)
        return runtime_manager.install()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc
