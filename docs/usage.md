# Usage Guide

Learn how to use Bonsai Desk effectively for chatting with local AI models.

## Table of Contents

- [Getting Started](#getting-started)
- [The Interface](#the-interface)
- [Chatting](#chatting)
- [Managing Conversations](#managing-conversations)
- [Runtime Controls](#runtime-controls)
- [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

After completing [installation](./installation.md) and setup:

1. Start the application: `.\scripts\run-dev.ps1`
2. Open http://127.0.0.1:5173 in your browser
3. Verify the runtime is running (green indicator)
4. Click "New Chat" to begin

## The Interface

Bonsai Desk has three main areas:

### Sidebar (Left)

- **New Chat**: Start a fresh conversation
- **Conversation History**: List of previous chats
- **Runtime Panel**: Access runtime controls
- **Settings**: Configure preferences

### Chat Area (Center)

- **Message List**: Your conversation history
- **Composer**: Input field for new messages
- **Streaming Indicator**: Shows when AI is responding

### Runtime Panel (Modal)

Access via the sidebar or status indicator:
- Start/stop the runtime
- Adjust inference parameters
- View logs and health status
- Change system prompt

## Chatting

### Sending Messages

1. Type your message in the composer at the bottom
2. Press **Enter** to send
3. The AI will respond with streaming text

### Message Actions

Hover over any message to see options:

| Action | Description |
|--------|-------------|
| **Copy** | Copy message text to clipboard |
| **Edit** | Modify your message and regenerate response |
| **Regenerate** | Get a new response for the same prompt |
| **Delete** | Remove the message from conversation |

### Markdown Support

Bonsai Desk supports Markdown formatting in responses:

- **Bold**: `**text**`
- *Italic*: `*text*`
- `Code`: `` `code` ``
- ```Code blocks```: ` ```code``` `
- [Links](url): `[text](url)`
- Lists: `- item` or `1. item`

## Managing Conversations

### Creating New Chats

Click "New Chat" in the sidebar to start fresh. Previous conversations are automatically saved.

### Switching Conversations

Click any conversation in the sidebar to resume it. The full history loads instantly.

### Renaming Conversations

Conversations are automatically named based on the first message. To rename:

1. Hover over conversation in sidebar
2. Click the edit icon
3. Enter new name
4. Press Enter to save

### Deleting Conversations

1. Hover over conversation in sidebar
2. Click the delete icon
3. Confirm deletion

> **Note**: Deleted conversations cannot be recovered.

### Searching Conversations

Use the search box in the sidebar to find past conversations by content.

## Runtime Controls

### Opening the Runtime Panel

Click the runtime status indicator (top of sidebar) or "Runtime" in the sidebar.

### Runtime States

| State | Indicator | Action |
|-------|-----------|--------|
| **Running** | Green | Runtime is active and ready |
| **Starting** | Yellow | Runtime is initializing |
| **Stopped** | Gray | Runtime is inactive |
| **Error** | Red | Runtime encountered an error |

### Starting the Runtime

1. Open Runtime Panel
2. Click "Start Runtime"
3. Wait for status to show "Running"
4. Close panel and begin chatting

### Stopping the Runtime

1. Open Runtime Panel
2. Click "Stop Runtime"
3. Runtime releases GPU/CPU resources

### Adjusting Parameters

1. Open Runtime Panel
2. Modify parameters in the form
3. Click "Apply Settings"
4. Some changes require restart (indicated in UI)

### Viewing Logs

The Runtime Panel shows real-time logs from the llama-server process. Useful for debugging.

### Using Presets

Quick-select common configurations:

- **Demo**: Fast, lower quality (good for testing)
- **Power**: Balanced quality and speed
- **Max**: Best quality, slower generation

Click a preset, then "Apply Settings" to use it.

## Tips and Best Practices

### Optimizing Performance

#### For Speed
- Use "Demo" preset
- Reduce context size
- Lower max tokens
- Increase GPU layers (if you have GPU)

#### For Quality
- Use "Max" preset
- Increase context size
- Adjust temperature (0.7-0.9 for creativity, 0.2-0.4 for precision)

#### For GPU Users
- Set GPU layers to maximum your VRAM allows
- Monitor GPU usage in Task Manager
- Reduce layers if you get out-of-memory errors

### Writing Effective Prompts

#### Be Specific
```
❌ "Tell me about Python"
✅ "Explain Python list comprehensions with 3 practical examples"
```

#### Provide Context
```
❌ "Fix this code"
✅ "This Python function should sort a list of dictionaries by 'date'. It's returning None. [paste code]"
```

#### Use System Prompt
Customize the system prompt for specialized tasks:

```
You are a code reviewer. Focus on performance, security, and maintainability.
Provide specific line-by-line feedback.
```

### Managing Context

The model has a limited context window (default 4096 tokens). To make the most of it:

1. **Start fresh chats** for new topics
2. **Summarize long conversations** periodically
3. **Reference specific information** rather than relying on full history

### Troubleshooting Responses

| Issue | Solution |
|-------|----------|
| Responses too short | Increase max tokens |
| Responses too random | Lower temperature |
| Responses repetitive | Increase temperature or top-p |
| Cut-off responses | Increase context size |
| Slow generation | Use Demo preset or increase GPU layers |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in composer |
| `Ctrl + N` | New chat |
| `Ctrl + F` | Search conversations |
| `Escape` | Close modals |

### Data Privacy

Since Bonsai Desk runs locally:
- Conversations are stored only on your machine
- No data is sent to external servers (except model/runtime downloads)
- You can delete all data by removing the `.bonsai-desk/` folder

### Backup and Export

To backup your conversations:

```powershell
# Copy the database
copy $env:USERPROFILE\.bonsai-desk\bonsai_desk.db C:\Backups\bonsai_backup.db
```

To restore:

```powershell
copy C:\Backups\bonsai_backup.db $env:USERPROFILE\.bonsai-desk\bonsai_desk.db
```
