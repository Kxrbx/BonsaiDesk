# Architecture Overview

System design, data flow, and component architecture of Bonsai Desk.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Component Overview](#component-overview)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Storage Layer](#storage-layer)
- [Runtime Management](#runtime-management)

## High-Level Architecture

Bonsai Desk follows a client-server architecture with three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Browser)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Chat UI    │  │   Sidebar   │  │   Runtime Panel     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   API       │  │   Runtime   │  │    Persistence      │ │
│  │  Routes     │  │   Manager   │  │     (SQLite)        │ │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘ │
└──────────────────────────┼──────────────────────────────────┘
                           │ Process Management
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Runtime (llama-server)                     │
│              (Prism-compatible llama.cpp)                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Overview

### Frontend (React + Vite)

**Location**: `frontend/`

| Component | Responsibility |
|-----------|----------------|
| `App.tsx` | Root component, global state |
| `Sidebar.tsx` | Navigation, conversation list |
| `MessageList.tsx` | Chat message display |
| `Composer.tsx` | Message input |
| `RuntimePanel.tsx` | Runtime controls |
| `SetupScreen.tsx` | Initial configuration |

**Key Libraries**:
- React 19 for UI
- Vite for build tooling
- Custom API client for backend communication

### Backend (FastAPI)

**Location**: `backend/`

| Module | Responsibility |
|--------|----------------|
| `main.py` | FastAPI app, middleware, lifespan |
| `api/routes_*.py` | REST endpoint definitions |
| `core/runtime_manager.py` | llama-server lifecycle |
| `core/chat_service.py` | Chat logic, streaming |
| `core/config.py` | Settings management |
| `db/storage.py` | SQLite persistence |

**Key Libraries**:
- FastAPI for REST API
- Uvicorn for ASGI server
- HTTPX for runtime proxy
- SQLite for data persistence

### Runtime (llama-server)

**Location**: `.bonsai-desk/runtime/`

The Prism-compatible llama-server process that:
- Loads the GGUF model into memory
- Provides OpenAI-compatible API
- Handles inference requests
- Supports GPU acceleration via CUDA

## Data Flow

### Chat Message Flow

```
1. User types message in Composer
2. Frontend POST /api/v1/chat/stream
3. Backend saves message to SQLite
4. Backend forwards to llama-server
5. llama-server streams tokens
6. Backend proxies stream to frontend
7. Frontend displays streaming text
8. Backend saves response on completion
```

### Runtime Startup Flow

```
1. User clicks "Start Runtime"
2. Frontend POST /api/v1/runtime/start
3. Backend validates model exists
4. Backend spawns llama-server process
5. Backend polls for health check
6. Backend returns success/failure
7. Frontend shows runtime status
```

### Conversation Persistence Flow

```
1. User creates new chat
2. Frontend POST /api/v1/conversations
3. Backend inserts into SQLite
4. User sends message
5. Backend updates conversation timestamp
6. On page reload, GET /conversations returns list
```

## Technology Stack

### Backend Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | FastAPI | REST API framework |
| Server | Uvicorn | ASGI server |
| Database | SQLite | Data persistence |
| HTTP Client | HTTPX | Runtime proxy |
| Process Mgmt | asyncio.subprocess | Runtime control |

### Frontend Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 19 | UI library |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Bundling, dev server |
| Styling | CSS Modules | Component styles |

### Runtime Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Inference | llama.cpp | GGUF model inference |
| API | OpenAI-compatible | Chat completions |
| GPU | CUDA (optional) | Acceleration |

## Storage Layer

### SQLite Schema

**Conversations Table**:
```sql
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Messages Table**:
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id),
    role TEXT CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Settings Table**:
```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### File Storage

```
.bonsai-desk/
├── bonsai_desk.db          # SQLite database
├── settings.json           # Runtime configuration
├── runtime/
│   └── llama-server.exe    # Runtime binary
└── models/
    └── Bonsai-8B.gguf      # Model weights
```

## Runtime Management

### Process Lifecycle

```
Stopped → Starting → Running → Stopping → Stopped
            ↑___________|          |
            |______________________|
                    (error)
```

### Configuration Persistence

Runtime parameters are stored in SQLite and applied on startup:

1. User changes settings in UI
2. Frontend POST /runtime/settings
3. Backend validates and stores in SQLite
4. On runtime start, settings are passed as CLI args

### Health Monitoring

The backend monitors runtime health:
- Polls /health endpoint on llama-server
- Tracks process PID
- Restarts on unexpected termination (optional)

## Security Considerations

### Local-Only Design

- API binds to localhost only (127.0.0.1)
- No authentication required (single-user)
- CORS restricted to dev server origins

### Data Privacy

- All data stored locally
- No cloud services (except model downloads)
- User controls all data

## Scalability Limits

Current design constraints:
- Single local user
- One runtime instance
- SQLite (no concurrent writes)
- Windows primary platform

Future improvements may address these limits.
