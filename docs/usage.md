# Usage Guide

Learn how to use Bonsai Desk after installation.

## Getting Started

1. Start the app with `.\launch-app.bat`.
2. Open `http://127.0.0.1:5173` if your browser does not open automatically.
3. Use the setup wizard to download official assets or link your own `llama-server.exe` and `.gguf` model.
4. Click **Start Runtime** and wait for the status indicator to turn green.
5. Click **New Chat** and send your first message.

## Interface Overview

### Sidebar
- **New Chat** starts a new conversation.
- **Conversation History** lets you reopen previous chats.
- **Runtime** opens the modal for runtime settings, Bonsai model variants, diagnostics, and logs.
- On mobile, **Conversations** opens the sidebar drawer.

### Chat Area
- The center panel shows conversation messages.
- The input box at the bottom sends new prompts.
- Responses stream in as the model generates text.

### Runtime Modal
- Start, stop, and restart the runtime.
- Adjust inference settings such as temperature, top-k, top-p, max tokens, context size, GPU layers, and system prompt.
- Switch between Bonsai `8B`, `4B`, and `1.7B`.
- View runtime diagnostics, health checks, and logs.

## Conversations

- Click **New Chat** to start fresh.
- Select a conversation in the sidebar to resume it.
- Rename or delete conversations from the sidebar actions.
- Conversations are stored locally in `.bonsai-desk/`.

## Prompting Tips

### Be Specific
```text
Bad: "Tell me about Python"
Good: "Explain Python list comprehensions with 3 practical examples"
```

### Provide Context
```text
Bad: "Fix this code"
Good: "This Python function should sort a list of dictionaries by 'date', but it returns None. [paste code]"
```

### Use the System Prompt
```text
You are a code reviewer. Focus on correctness, security, and maintainability.
Provide concrete suggestions and mention tradeoffs.
```

## Troubleshooting During Use

| Issue | What to Try |
|------|-------------|
| Runtime is red or gray | Open the Runtime Modal and click **Start Runtime** |
| Wrong model variant is active | Open the Runtime Modal and select `8B`, `4B`, or `1.7B` |
| Setup cannot find your files | Use **Browse...** or paste the full local path manually |
| Responses are too short | Increase max tokens |
| Responses are too random | Lower temperature |
| Responses are repetitive | Increase temperature or top-p |
| Generation is slow | Use the Demo preset or increase GPU layers if you have VRAM |
| Browser page is blank | Refresh and check backend/frontend terminal windows for errors |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | Add a new line |
| `Ctrl + N` | New chat |
| `Escape` | Close modals |

## Privacy and Backups

Bonsai Desk runs locally. Your conversations stay on your machine unless you manually share files.

To back up your chat database:

```powershell
copy $env:USERPROFILE\.bonsai-desk\bonsai_desk.db C:\Backups\bonsai_backup.db
```

To restore it:

```powershell
copy C:\Backups\bonsai_backup.db $env:USERPROFILE\.bonsai-desk\bonsai_desk.db
```
