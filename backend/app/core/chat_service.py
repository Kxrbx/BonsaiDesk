from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from app.core.runtime_manager import RuntimeManager
from app.core.schemas import ChatGenerationRequest, ChatStreamEvent, Message, RuntimeConfig
from app.db.storage import Storage


class ChatService:
    def __init__(self, storage: Storage, runtime_manager: RuntimeManager) -> None:
        self.storage = storage
        self.runtime_manager = runtime_manager

    def _resolve_config(self, request: ChatGenerationRequest) -> RuntimeConfig:
        config = self.runtime_manager.get_runtime_config()
        if request.override_system_prompt is not None:
            config.system_prompt = request.override_system_prompt
        if request.override_temperature is not None:
            config.temperature = request.override_temperature
        if request.override_top_k is not None:
            config.top_k = request.override_top_k
        if request.override_top_p is not None:
            config.top_p = request.override_top_p
        if request.override_min_p is not None:
            config.min_p = request.override_min_p
        if request.override_max_tokens is not None:
            config.max_tokens = request.override_max_tokens
        return config

    def _history_messages(self, conversation_id: str, system_prompt: str) -> list[dict[str, str]]:
        conversation = self.storage.get_conversation(conversation_id)
        if not conversation:
            raise RuntimeError("Conversation not found.")

        messages: list[dict[str, str]] = []
        if system_prompt.strip():
            messages.append({"role": "system", "content": system_prompt.strip()})
        for message in conversation.messages:
            messages.append({"role": message.role, "content": message.content})
        return messages

    async def stream_chat(self, request: ChatGenerationRequest) -> AsyncIterator[str]:
        status = await self.runtime_manager.get_status()
        if not status.installed:
            raise RuntimeError("Runtime is not installed yet.")
        if not status.ready:
            status = await self.runtime_manager.start()

        config = self._resolve_config(request)
        conversation_id = request.conversation_id
        if conversation_id:
            conversation = self.storage.get_conversation(conversation_id)
            if not conversation:
                raise RuntimeError("Conversation not found.")
        else:
            conversation = self.storage.create_conversation()
            conversation_id = conversation.id

        self.storage.add_message(conversation_id, "user", request.content)
        self.storage.auto_title_conversation(conversation_id)

        assistant_message_id = ""
        assistant_parts: list[str] = []
        yield self._format_event(ChatStreamEvent(type="meta", conversation_id=conversation_id))

        payload = {
            "messages": self._history_messages(conversation_id, config.system_prompt),
            "stream": True,
            "temperature": config.temperature,
            "top_k": config.top_k,
            "top_p": config.top_p,
            "min_p": config.min_p,
            "max_tokens": config.max_tokens,
        }

        base_url = f"http://{config.host}:{config.port}"
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", f"{base_url}/v1/chat/completions", json=payload) as response:
                    response.raise_for_status()
                    async for raw_line in response.aiter_lines():
                        if not raw_line.startswith("data:"):
                            continue
                        data = raw_line[5:].strip()
                        if not data or data == "[DONE]":
                            continue
                        chunk = json.loads(data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                        if not delta:
                            continue
                        assistant_parts.append(delta)
                        if not assistant_message_id:
                            assistant_message_id = "pending"
                        yield self._format_event(
                            ChatStreamEvent(
                                type="delta",
                                conversation_id=conversation_id,
                                message_id=assistant_message_id,
                                delta=delta,
                            )
                        )
        except Exception as exc:  # noqa: BLE001
            yield self._format_event(
                ChatStreamEvent(
                    type="error",
                    conversation_id=conversation_id,
                    error=str(exc),
                )
            )
            return

        assistant_text = "".join(assistant_parts).strip()
        saved_message: Message | None = None
        if assistant_text:
            saved_message = self.storage.add_message(conversation_id, "assistant", assistant_text)
            assistant_message_id = saved_message.id

        self.storage.auto_title_conversation(conversation_id)
        yield self._format_event(
            ChatStreamEvent(
                type="done",
                conversation_id=conversation_id,
                message_id=assistant_message_id or None,
            )
        )

    @staticmethod
    def _format_event(event: ChatStreamEvent) -> str:
        return f"data: {event.model_dump_json()}\n\n"
