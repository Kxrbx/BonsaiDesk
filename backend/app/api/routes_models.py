from __future__ import annotations

from fastapi import APIRouter

from app.core.schemas import ModelDescriptor
from app.services import runtime_manager

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=list[ModelDescriptor])
def list_models() -> list[ModelDescriptor]:
    return [runtime_manager.get_model_descriptor()]
