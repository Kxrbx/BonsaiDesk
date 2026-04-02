# API Reference

REST API documentation for the Bonsai Desk backend.

## Base URL

```
http://127.0.0.1:8000/api/v1
```

Override with `VITE_API_BASE_URL` environment variable.

## Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check |
| /runtime/status | GET | Get runtime status |
| /runtime/start | POST | Start runtime |
| /runtime/stop | POST | Stop runtime |
| /runtime/settings | GET/POST | Get/update settings |
| /models | GET | List available models |
| /conversations | GET/POST | List/create conversations |
| /conversations/{id} | GET/PUT/DELETE | Manage conversation |
| /chat | POST | Send chat message |
| /chat/stream | POST | Stream chat response |

## Health Check

### GET /health

Check if backend is running.

**Response**:
```json
{
  "status": "ok"
}
```

## Runtime Endpoints

### GET /runtime/status

Get current runtime status and configuration.

**Response**:
```json
{
  "status": "running",
  "pid": 12345,
  "host": "127.0.0.1",
  "port": 8080,
  "model_loaded": "Bonsai-8B.gguf",
  "gpu_layers": 35,
  "context_size": 4096
}
```

### POST /runtime/start

Start the llama-server runtime.

**Request Body**:
```json
{
  "gpu_layers": 35,
  "context_size": 4096,
  "threads": 4
}
```

**Response**:
```json
{
  "status": "starting",
  "pid": 12345
}
```

### POST /runtime/stop

Stop the runtime.

**Response**:
```json
{
  "status": "stopped"
}
```

### GET /runtime/settings

Get current runtime settings.

### POST /runtime/settings

Update runtime settings.

**Request Body**:
```json
{
  "temperature": 0.7,
  "top_k": 40,
  "top_p": 0.9,
  "max_tokens": 2048,
  "system_prompt": "You are a helpful assistant."
}
```

## Model Endpoints

### GET /models

List available models.

**Response**:
```json
{
  "models": [
    {
      "id": "bonsai-8b",
      "name": "Bonsai-8B",
      "filename": "Bonsai-8B.gguf",
      "size": "8B",
      "downloaded": true,
      "path": "C:\Users\...\Bonsai-8B.gguf"
    }
  ]
}
```

## Conversation Endpoints

### GET /conversations

List all conversations.

**Response**:
```json
{
  "conversations": [
    {
      "id": "uuid-123",
      "title": "Python Help",
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T11:30:00Z",
      "message_count": 12
    }
  ]
}
```

### POST /conversations

Create a new conversation.

**Request Body**:
```json
{
  "title": "New Chat"
}
```

### GET /conversations/{id}

Get a specific conversation with messages.

**Response**:
```json
{
  "id": "uuid-123",
  "title": "Python Help",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "How do I use list comprehensions?",
      "created_at": "2026-04-02T10:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "List comprehensions provide a concise way...",
      "created_at": "2026-04-02T10:00:05Z"
    }
  ]
}
```

### PUT /conversations/{id}

Update conversation (rename).

**Request Body**:
```json
{
  "title": "New Title"
}
```

### DELETE /conversations/{id}

Delete a conversation.

## Chat Endpoints

### POST /chat

Send a message and get a complete response.

**Request Body**:
```json
{
  "conversation_id": "uuid-123",
  "message": "Explain Python decorators",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**Response**:
```json
{
  "message": {
    "id": "msg-3",
    "role": "assistant",
    "content": "Python decorators are a powerful feature..."
  }
}
```

### POST /chat/stream

Stream a response (Server-Sent Events).

**Request Body**:
```json
{
  "conversation_id": "uuid-123",
  "message": "Write a haiku about coding"
}
```

**Response**: Stream of SSE events

```
event: message
data: {"chunk": "Lines"}

event: message
data: {"chunk": " of"}

event: message
data: {"chunk": " code"}

event: done
data: {}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "RUNTIME_NOT_RUNNING",
    "message": "Runtime must be started before chatting",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| RUNTIME_NOT_RUNNING | 400 | Runtime needs to be started |
| MODEL_NOT_FOUND | 404 | Model file not found |
| CONVERSATION_NOT_FOUND | 404 | Conversation doesn't exist |
| INVALID_PARAMETERS | 400 | Bad request parameters |
| INTERNAL_ERROR | 500 | Server error |

## Authentication

Currently, Bonsai Desk does not implement authentication as it's designed for local single-user use. The API is bound to localhost only.
