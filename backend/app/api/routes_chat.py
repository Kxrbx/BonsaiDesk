from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.schemas import ChatGenerationRequest
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/stream")
async def stream_chat(payload: ChatGenerationRequest) -> StreamingResponse:
    try:
        stream = chat_service.stream_chat(payload)
        return StreamingResponse(stream, media_type="text/event-stream")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc
