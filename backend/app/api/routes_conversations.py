from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.schemas import Conversation, ConversationSummary, CreateConversationRequest, UpdateConversationRequest
from app.services import storage

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationSummary])
def list_conversations() -> list[ConversationSummary]:
    return storage.list_conversations()


@router.post("", response_model=Conversation)
def create_conversation(payload: CreateConversationRequest) -> Conversation:
    return storage.create_conversation(payload.title)


@router.get("/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: str) -> Conversation:
    conversation = storage.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.patch("/{conversation_id}", response_model=Conversation)
def update_conversation(conversation_id: str, payload: UpdateConversationRequest) -> Conversation:
    conversation = storage.update_conversation_title(conversation_id, payload.title)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str) -> dict[str, bool]:
    deleted = storage.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"deleted": True}
