from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.schemas import Conversation, ConversationSummary, Message, RuntimeConfig


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Storage:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                """
            )

    def get_runtime_config(self) -> RuntimeConfig:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT value FROM settings WHERE key = 'runtime_config'"
            ).fetchone()
        if not row:
            return RuntimeConfig()
        return RuntimeConfig.model_validate(json.loads(row["value"]))

    def save_runtime_config(self, config: RuntimeConfig) -> RuntimeConfig:
        payload = json.dumps(config.model_dump(mode="json"))
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO settings(key, value)
                VALUES('runtime_config', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (payload,),
            )
        return config

    def list_conversations(self) -> list[ConversationSummary]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT c.id, c.title, c.created_at, c.updated_at,
                       COALESCE((
                           SELECT m.content
                           FROM messages m
                           WHERE m.conversation_id = c.id
                           ORDER BY m.created_at DESC
                           LIMIT 1
                       ), '') AS preview
                FROM conversations c
                ORDER BY c.updated_at DESC
                """
            ).fetchall()
        return [
            ConversationSummary(
                id=row["id"],
                title=row["title"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
                preview=row["preview"],
            )
            for row in rows
        ]

    def create_conversation(self, title: str | None = None) -> Conversation:
        now = utcnow()
        conversation_id = str(uuid.uuid4())
        resolved_title = title or "New conversation"
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO conversations(id, title, created_at, updated_at)
                VALUES(?, ?, ?, ?)
                """,
                (conversation_id, resolved_title, now.isoformat(), now.isoformat()),
            )
        return Conversation(
            id=conversation_id,
            title=resolved_title,
            created_at=now,
            updated_at=now,
            messages=[],
        )

    def get_conversation(self, conversation_id: str) -> Conversation | None:
        with self._connect() as connection:
            conversation = connection.execute(
                "SELECT * FROM conversations WHERE id = ?",
                (conversation_id,),
            ).fetchone()
            if not conversation:
                return None
            rows = connection.execute(
                """
                SELECT * FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
                """,
                (conversation_id,),
            ).fetchall()
        return Conversation(
            id=conversation["id"],
            title=conversation["title"],
            created_at=datetime.fromisoformat(conversation["created_at"]),
            updated_at=datetime.fromisoformat(conversation["updated_at"]),
            messages=[
                Message(
                    id=row["id"],
                    conversation_id=row["conversation_id"],
                    role=row["role"],
                    content=row["content"],
                    created_at=datetime.fromisoformat(row["created_at"]),
                )
                for row in rows
            ],
        )

    def update_conversation_title(self, conversation_id: str, title: str) -> Conversation | None:
        now = utcnow()
        with self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE conversations
                SET title = ?, updated_at = ?
                WHERE id = ?
                """,
                (title, now.isoformat(), conversation_id),
            )
            if cursor.rowcount == 0:
                return None
        return self.get_conversation(conversation_id)

    def delete_conversation(self, conversation_id: str) -> bool:
        with self._connect() as connection:
            connection.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
            cursor = connection.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        return cursor.rowcount > 0

    def add_message(self, conversation_id: str, role: str, content: str) -> Message:
        message_id = str(uuid.uuid4())
        now = utcnow()
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO messages(id, conversation_id, role, content, created_at)
                VALUES(?, ?, ?, ?, ?)
                """,
                (message_id, conversation_id, role, content, now.isoformat()),
            )
            connection.execute(
                "UPDATE conversations SET updated_at = ? WHERE id = ?",
                (now.isoformat(), conversation_id),
            )
        return Message(
            id=message_id,
            conversation_id=conversation_id,
            role=role,  # type: ignore[arg-type]
            content=content,
            created_at=now,
        )

    def auto_title_conversation(self, conversation_id: str) -> None:
        conversation = self.get_conversation(conversation_id)
        if not conversation or conversation.title != "New conversation":
            return

        first_user_message = next((m for m in conversation.messages if m.role == "user"), None)
        if not first_user_message:
            return

        title = " ".join(first_user_message.content.strip().split())
        title = title[:48] + ("..." if len(title) > 48 else "")
        self.update_conversation_title(conversation_id, title or "New conversation")
