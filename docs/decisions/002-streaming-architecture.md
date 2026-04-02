# ADR 002: Streaming Architecture for Chat Responses

## Status

Accepted

## Context

Bonsai Desk needs to stream AI responses from the runtime (llama-server) to the frontend UI. We need to decide:

1. How to handle streaming from runtime to backend
2. How to handle streaming from backend to frontend
3. How to persist messages during streaming

## Decision

### Runtime to Backend

Use **HTTPX streaming** with async generators:
- Backend proxies the runtime's SSE (Server-Sent Events) stream
- Processes chunks as they arrive
- Accumulates full response for persistence

### Backend to Frontend

Use **Server-Sent Events (SSE)**:
- Single HTTP connection with text/event-stream
- Simple text-based protocol
- Native browser support via EventSource
- Automatic reconnection handling

### Message Persistence

**Two-phase approach**:
1. Stream response to client in real-time
2. Persist complete message to SQLite after streaming finishes

This ensures:
- User sees immediate feedback
- Partial responses aren't persisted if interrupted
- Complete conversation history maintained

## Consequences

### Positive
- Real-time user experience
- Simple protocol (SSE vs WebSocket)
- No partial/corrupted messages in database
- Easy to debug (text-based protocol)

### Negative
- Connection must stay open during generation
- No message history if browser refreshes mid-stream
- Requires careful error handling for interruptions

## Implementation Details

### Event Types

```
meta:    { conversation_id: string }
delta:   { delta: string, message_id?: string }
done:    { message_id?: string }
error:   { error: string }
```

### Error Handling

- Runtime disconnect: Stream error event, keep conversation
- Network issues: Client retries with exponential backoff
- Generation errors: Error event with details

## Alternatives Considered

### WebSocket
- **Pros**: Bidirectional, lower overhead after handshake
- **Cons**: More complex, requires WebSocket library, harder to debug

### Long Polling
- **Pros**: Works with older browsers
- **Cons**: Higher latency, more overhead, unnecessary complexity

### Chunked HTTP Response
- **Pros**: Simple HTTP
- **Cons**: No standard event format, harder to parse

## References

- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [HTTPX Streaming](https://www.python-httpx.org/async/#streaming-responses)
