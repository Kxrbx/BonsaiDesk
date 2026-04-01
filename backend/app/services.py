from __future__ import annotations

from app.core.chat_service import ChatService
from app.core.config import settings
from app.core.runtime_manager import RuntimeManager
from app.db.storage import Storage

storage = Storage(settings.database_path)
runtime_manager = RuntimeManager(storage)
chat_service = ChatService(storage, runtime_manager)
