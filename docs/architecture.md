# Architecture Overview

System design for Bonsai Desk `0.3.0`.

## High-Level Architecture

```text
+----------------------------+        +-----------------------------+        +---------------------------+
| Frontend (React + Vite)    |  HTTP  | Backend (FastAPI + SQLite)  |  HTTP  | Prism llama-server        |
|                            +------->|                             +------->| Bonsai GGUF inference     |
| - Chat UI                  |  SSE   | - API routes                |        | OpenAI-compatible API     |
| - Sidebar drawer           |<-------+ - Runtime manager           |<-------+ Streaming token responses |
| - Runtime modal            |        | - Chat proxy                |        +---------------------------+
| - Setup wizard             |        | - Conversation storage      |
+----------------------------+        +-----------------------------+
```

## Frontend

**Location**: `frontend/`

| Module | Responsibility |
|--------|----------------|
| `src/App.tsx` | App bootstrap, global UI state, runtime/chat orchestration |
| `src/components/Sidebar.tsx` | Conversation list, mobile drawer, chat actions |
| `src/components/MessageList.tsx` | Chat transcript and empty state |
| `src/components/Composer.tsx` | Prompt input and send action |
| `src/components/RuntimePanel.tsx` | Runtime modal, presets, model switching, diagnostics, logs |
| `src/pages/SetupScreen.tsx` | First-run setup, official downloads, local file linking, diagnostics |
| `src/api/client.ts` | Backend API client and SSE parsing |
| `src/lib/runtime-config.ts` | Runtime preset and config normalization logic |
| `src/lib/ui-prefs.ts` | Local UI preference persistence |

## Backend

**Location**: `backend/`

| Module | Responsibility |
|--------|----------------|
| `app/main.py` | FastAPI app, CORS, OpenAPI, shutdown cleanup |
| `app/api/routes_runtime.py` | Runtime lifecycle, install flow, diagnostics, local asset linking |
| `app/api/routes_models.py` | Bonsai model listing, selection, and install |
| `app/api/routes_conversations.py` | Conversation CRUD |
| `app/api/routes_chat.py` | SSE streaming chat endpoint |
| `app/core/runtime_manager.py` | Runtime process lifecycle, installation, model resolution, diagnostics |
| `app/core/model_catalog.py` | Official Bonsai model variants |
| `app/core/chat_service.py` | Prompt forwarding and streamed response persistence |
| `app/core/schemas.py` | API and persistence data models |
| `app/db/storage.py` | SQLite persistence for chats and runtime config |

## Data Flow

### App Bootstrap

```text
1. Frontend calls GET /api/runtime/overview
2. Backend returns status, config, models, install progress, sources, and diagnostics
3. Frontend loads conversations
4. UI shows either Setup Wizard or Chat Shell based on runtime/model availability
```

### Chat Streaming

```text
1. User sends a prompt from Composer
2. Frontend POSTs /api/chat/stream
3. Backend stores the user message in SQLite
4. Backend forwards the prompt to Prism llama-server
5. Runtime streams completion chunks
6. Backend proxies SSE token events to the browser
7. Backend stores the assistant response when generation completes
8. Frontend refreshes the conversation after done/error
```

### Runtime Setup and Model Switching

```text
1. Setup Wizard or Runtime Modal calls /api/models/select or /api/models/install
2. Backend updates the selected Bonsai variant and resolves the managed/local model path
3. /api/runtime/install downloads the selected model and runtime when needed
4. /api/runtime/start launches llama-server with the persisted config
```

## Storage

```text
.bonsai-desk/
|-- bonsai_desk.db
|-- runtime/
|   |-- bin/llama-server.exe
|   |-- llama-server.pid
|   `-- runtime.json
|-- models/
|   |-- Bonsai-8B.gguf
|   |-- Bonsai-4B.gguf
|   `-- Bonsai-1.7B.gguf
`-- logs/
    `-- llama-server.log
```

SQLite stores:

- Conversations and messages
- Persisted runtime config
- Linked local runtime/model paths

## Runtime Lifecycle

```text
stopped -> starting -> running -> stopping -> stopped
              |                         |
              +---------- error --------+
```

On backend shutdown, the runtime manager stops `llama-server` and, on Windows, attaches the process to a job object so closing the backend console unloads the model process too.

## Design Constraints

- Local single-user app
- Localhost-bound API by default
- Windows-first runtime and file picker UX
- Desktop packaging is not shipped yet
- Linux/macOS support is partially prepared in process management, but the setup flow is still Windows-oriented
