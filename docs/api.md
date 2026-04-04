# API Reference

Backend REST API reference for Bonsai Desk `0.3.0`.

## Base URL

```text
http://127.0.0.1:8000/api
```

Override the frontend target with `VITE_API_BASE_URL`.

## Endpoint Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/runtime/overview` | GET | Runtime status, config, models, install progress, source metadata, and diagnostics |
| `/runtime/status` | GET | Runtime status only |
| `/runtime/config` | GET / PUT | Read or update persisted runtime settings |
| `/runtime/install` | POST | Download the official Prism runtime and selected Bonsai model |
| `/runtime/install-progress` | GET | Poll background installation progress |
| `/runtime/diagnostics` | GET | Structured runtime checks, GPU info, runtime version, and recent logs |
| `/runtime/browse-binary` | POST | Open a native Windows picker for `llama-server.exe` |
| `/runtime/browse-model` | POST | Open a native Windows picker for `.gguf` models |
| `/runtime/use-existing-assets` | POST | Persist user-selected local runtime/model paths |
| `/runtime/start` | POST | Start `llama-server` |
| `/runtime/stop` | POST | Stop `llama-server` |
| `/runtime/restart` | POST | Restart `llama-server` |
| `/runtime/logs` | GET | Return recent runtime logs |
| `/models` | GET | List Bonsai variants and custom linked model state |
| `/models/select` | POST | Switch active Bonsai variant |
| `/models/install` | POST | Install a specific Bonsai variant |
| `/conversations` | GET / POST | List or create conversations |
| `/conversations/{id}` | GET / PATCH / DELETE | Read, rename, or delete one conversation |
| `/chat/stream` | POST | Stream a chat response as SSE |

`GET /health` is available outside `/api` for a simple backend health check.

## Runtime Overview

### GET `/runtime/overview`

Returns the full bootstrap payload used by the frontend.

```json
{
  "status": {
    "installed": true,
    "running": false,
    "ready": false,
    "pid": null,
    "host": "127.0.0.1",
    "port": 8080,
    "model_loaded": "Bonsai-8B.gguf",
    "message": "Runtime is stopped.",
    "install_message": "Runtime and model are available."
  },
  "config": {
    "temperature": 0.6,
    "top_k": 40,
    "top_p": 0.92,
    "min_p": 0.05,
    "max_tokens": 1024,
    "ctx_size": 65536,
    "gpu_layers": 99,
    "threads": 8,
    "batch_size": 2048,
    "system_prompt": "You are a helpful local AI assistant powered by Bonsai.",
    "reasoning_budget": -1,
    "reasoning_format": "parsed",
    "enable_thinking": true,
    "model_filename": "Bonsai-8B.gguf",
    "model_variant": "8B",
    "runtime_binary_path": "",
    "model_file_path": ""
  },
  "models": [
    {
      "id": "prism-ml/Bonsai-8B-gguf",
      "name": "Bonsai 8B",
      "filename": "Bonsai-8B.gguf",
      "size_hint": "1.16 GB",
      "local_path": "E:\\OpenCode-DEV\\Prism Launcher\\.bonsai-desk\\models\\Bonsai-8B.gguf",
      "installed": true,
      "variant": "8B",
      "download_url": "https://huggingface.co/prism-ml/Bonsai-8B-gguf/resolve/main/Bonsai-8B.gguf?download=true",
      "requirements_hint": "Recommended for RTX-class GPUs and higher-quality local reasoning.",
      "is_active": true,
      "is_downloaded": true
    }
  ],
  "install_progress": {
    "state": "completed",
    "current_step": "Already installed",
    "detail": "Runtime and model are available.",
    "progress": 100,
    "runtime_progress": 100,
    "model_progress": 100,
    "error": null,
    "started_at": null,
    "updated_at": null
  },
  "sources": [
    {
      "kind": "Model",
      "name": "Bonsai 8B GGUF",
      "license_name": "Apache-2.0",
      "source_url": "https://huggingface.co/prism-ml/Bonsai-8B-gguf"
    }
  ],
  "diagnostics": {
    "platform_label": "Windows",
    "gpu_label": "NVIDIA GPU detected",
    "cuda_label": "CUDA available",
    "runtime_version": "llama-server --version output",
    "checks": [
      {
        "key": "runtime_binary",
        "label": "Runtime binary",
        "state": "ok",
        "detail": "Resolved managed Prism runtime.",
        "action": ""
      }
    ],
    "recent_logs": []
  }
}
```

## Runtime Config

### GET `/runtime/config`

Returns the persisted `RuntimeConfig`.

### PUT `/runtime/config`

Persists runtime and inference settings.

```json
{
  "temperature": 0.6,
  "top_k": 40,
  "top_p": 0.92,
  "min_p": 0.05,
  "max_tokens": 1024,
  "ctx_size": 65536,
  "gpu_layers": 99,
  "threads": 8,
  "batch_size": 2048,
  "system_prompt": "You are a helpful local AI assistant powered by Bonsai.",
  "reasoning_budget": -1,
  "reasoning_format": "parsed",
  "enable_thinking": true,
  "model_filename": "Bonsai-8B.gguf",
  "model_variant": "8B",
  "runtime_binary_path": "",
  "model_file_path": ""
}
```

`reasoning_budget` is normalized to `-1` (unrestricted thinking) or `0` (thinking disabled).

## Model Endpoints

### GET `/models`

Returns all Bonsai variants and marks which one is active and downloaded.

### POST `/models/select`

```json
{
  "variant": "4B"
}
```

### POST `/models/install`

```json
{
  "variant": "1.7B"
}
```

## Local Asset Linking

### POST `/runtime/use-existing-assets`

```json
{
  "runtime_binary_path": "D:\\Tools\\Prism\\llama-server.exe",
  "model_file_path": "D:\\Models\\Bonsai-4B.gguf"
}
```

Send `null` or `""` to clear one of these linked paths.

## Conversations

### GET `/conversations`

Returns a list of conversation summaries.

### POST `/conversations`

```json
{
  "title": "New Chat"
}
```

### GET `/conversations/{id}`

Returns one conversation with its messages.

### PATCH `/conversations/{id}`

```json
{
  "title": "Renamed Chat"
}
```

### DELETE `/conversations/{id}`

```json
{
  "deleted": true
}
```

## Streaming Chat

### POST `/chat/stream`

```json
{
  "conversation_id": "conversation-uuid",
  "prompt": "Explain what Bonsai Desk does."
}
```

Response is streamed as newline-separated SSE `data:` events containing JSON objects with a `type` field:

```text
data: {"type":"token","content":"Hello","conversation_id":"conversation-uuid"}

data: {"type":"token","content":" there","conversation_id":"conversation-uuid"}

data: {"type":"done","content":"","conversation_id":"conversation-uuid"}
```

If the upstream runtime fails after streaming starts, the backend sends a terminal `error` event and the frontend rejects the stream.

## Errors

Request-time failures use FastAPI's default JSON shape:

```json
{
  "detail": "Conversation not found."
}
```
