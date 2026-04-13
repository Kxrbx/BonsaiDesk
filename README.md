# Bonsai Desk

[![CI](https://github.com/Kxrbx/BonsaiDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Kxrbx/BonsaiDesk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-a7f3c8.svg)](./LICENSE)
[![Platform: Windows](https://img.shields.io/badge/platform-Windows-blue.svg)]()
[![Python: 3.8+](https://img.shields.io/badge/python-3.8+-3776ab.svg)]()
[![Node: 18+](https://img.shields.io/badge/node-18+-339933.svg)]()

Local-first chat app for running Bonsai GGUF models (`8B`, `4B`, `1.7B`) with streaming responses, built-in Prism runtime management, model switching, runtime diagnostics, and saved conversation history.

<img width="1904" height="1031" alt="image" src="https://github.com/user-attachments/assets/16241ab0-d624-4927-8b93-b982522b0a01" />


## What is Bonsai Desk?

Bonsai Desk turns the Bonsai + Prism local workflow into a guided desktop-style web app. Instead of manually juggling model files and server scripts, you can install assets, start the runtime, and chat from one interface.

**What you get:**
- A modern local chat UI with conversation history
- A setup wizard for the Prism runtime and Bonsai GGUF model
- A runtime control panel for inference settings
- Local storage for settings and chats
- Support for official downloads or existing local files

**Current scope:**

| Aspect | Support |
|--------|---------|
| Platform | Windows first |
| Users | Single local user |
| Runtime | Prism-powered `llama-server` |
| Models | Bonsai GGUF 8B / 4B / 1.7B |

App data is stored in `.bonsai-desk/` by default. If an older `.prism-launcher/` folder exists, Bonsai Desk reuses it automatically.

## Beginner Setup Guide

If you are new to local development on Windows, follow these steps in order.

### 1. Install the required software

You need Python, Node.js, and Git before launching Bonsai Desk.

**Python**
1. Download Python from [python.org/downloads](https://www.python.org/downloads/).
2. Run the installer.
3. Check **Add Python to PATH**.
4. Click **Install Now**.
5. Open PowerShell and verify:

```powershell
python --version
```

**Node.js**
1. Download the **LTS** version from [nodejs.org](https://nodejs.org/).
2. Install with the default options.
3. Restart PowerShell.
4. Verify:

```powershell
node --version
npm --version
```

**Git**
1. Download Git from [git-scm.com/download/win](https://git-scm.com/download/win).
2. Install with the default options.
3. Verify:

```powershell
git --version
```

### 2. Download this project

Open PowerShell and run:

```powershell
git clone https://github.com/Kxrbx/BonsaiDesk.git
cd BonsaiDesk
```

### 3. Install backend and frontend dependencies

**Easiest option**

Double-click `install.bat` in the project folder.

This checks whether Python and Node.js are installed, then installs the backend and frontend dependencies for you.

**Manual option**

First try the normal PowerShell script command:

```powershell
.\scripts\bootstrap.ps1
```

If Windows says script execution is disabled, use this version instead:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
```

When the script finishes, you should see:

```text
Bootstrap complete.
```

What this script does:
- Creates a Python virtual environment in `.venv/`
- Installs backend Python packages from `backend/requirements.txt`
- Installs frontend Node packages inside `frontend/`

### 4. Start the app

**Recommended option**

```powershell
.\launch-app.bat
```

This opens the backend and frontend in separate PowerShell windows and then opens `http://127.0.0.1:5173` in your browser.

**Manual option**

If you prefer to launch the development scripts directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-dev.ps1
```

Keep the backend and frontend terminal windows open while using the app. Closing them stops Bonsai Desk.

### 5. Complete the first-time setup wizard

The first time the app opens, it will ask how you want to provide the runtime and model.

**Option A: Download Official Assets**
- Choose this if you do not already have model/runtime files.
- The app downloads `llama-server.exe` and the Bonsai `.gguf` model.
- Model download size depends on the selected variant: about 1.16 GB for 8B, 572 MB for 4B, and 248 MB for 1.7B.

**Option B: Use Local Files**
- Choose this if you already have a Prism-compatible `llama-server.exe` and a `.gguf` model.
- Browse to those files and link them in the UI.

Then click **Start Runtime** and wait for the status indicator to turn green.

### 6. Start chatting

1. Click **New Chat**.
2. Type a message in the box at the bottom.
3. Press **Enter** or click send.

Example prompt:

```text
Hello! Can you explain what you are?
```

## Common Commands

| Task | Command |
|------|---------|
| Install dependencies with one double-click | `install.bat` |
| Install dependencies | `.\scripts\bootstrap.ps1` |
| Install dependencies if `.ps1` is blocked | `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1` |
| Start the full app | `.\launch-app.bat` |
| Start backend + frontend manually | `powershell -ExecutionPolicy Bypass -File .\scripts\run-dev.ps1` |
| Run backend only | `powershell -ExecutionPolicy Bypass -File .\scripts\run-backend.ps1` |
| Run frontend only | `powershell -ExecutionPolicy Bypass -File .\scripts\run-frontend.ps1` |
| Run checks before committing | `.\scripts\check.ps1` |

## Features

### Chat Experience
- Local-first interface with streaming responses
- Persistent conversation history
- Conversation rename/delete actions and a mobile sidebar drawer

### Runtime Management
- One-click install / start / stop / restart
- Runtime health and logs
- Runtime diagnostics and model variant selection
- Persistent runtime settings

### Inference Controls
- System prompt
- Temperature, top-k, top-p, and min-p
- Max tokens and context size
- GPU layers and thread count
- Reasoning budget and format options
- Presets: demo, power, max

### Setup Flexibility
- Download official Bonsai / Prism assets
- Link an existing `llama-server.exe` and `.gguf` model

## Documentation

More detailed docs live in the `docs/` folder:

| Document | Description |
|----------|-------------|
| [Installation Guide](./docs/installation.md) | Detailed setup instructions |
| [Configuration](./docs/configuration.md) | Environment variables and settings |
| [Usage Guide](./docs/usage.md) | How to use the chat interface |
| [Troubleshooting](./docs/troubleshooting.md) | Common issues and fixes |
| [Architecture](./docs/architecture.md) | System design and data flow |
| [API Reference](./docs/api.md) | Backend API documentation |
| [Development](./docs/development.md) | Contributor setup and workflow |

## Configuration

Important environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `BONSAI_DESK_HOME` | App data folder | `.bonsai-desk/` |
| `PRISM_LLAMA_SERVER_PATH` | Custom `llama-server.exe` path | Auto-detected |
| `PRISM_MODEL_URL` | Custom model download URL | Official selected Bonsai variant URL |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://127.0.0.1:8000` |

See `.env.example` for the full list.

Runtime lookup priority:
1. Runtime linked in the UI
2. Runtime installed by Bonsai Desk
3. `PRISM_LLAMA_SERVER_PATH`
4. Official Prism / Bonsai demo release
5. `PRISM_LLAMA_CPP_ZIP_URL`
6. `llama-server.exe` available on your system `PATH`

## Troubleshooting

### PowerShell says scripts are disabled

Use a one-time bypass command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
```

Or permanently allow local scripts for your Windows user:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### `python` is not recognized

Run:

```powershell
python --version
```

If that fails, reinstall Python and make sure **Add Python to PATH** is checked.

### `node` or `npm` is not recognized

Run:

```powershell
node --version
npm --version
```

If that fails, reinstall Node.js LTS and restart PowerShell.

### Port 8080 is already in use

Create a local `.env` file:

```powershell
copy .env.example .env
notepad .env
```

Change:

```text
PRISM_RUNTIME_PORT=8080
```

To another free port, for example:

```text
PRISM_RUNTIME_PORT=8081
```

### The runtime does not start

- Confirm the model download finished and the `.gguf` file size matches the selected variant.
- Reduce GPU layers in the Runtime Modal.
- Check whether Windows Security or antivirus is blocking `llama-server.exe`.

### The browser page is blank

- Wait 20 to 30 seconds for the backend and frontend to finish starting.
- Refresh the page.
- Check the backend and frontend PowerShell windows for errors.
- Make sure port `5173` is not blocked by another process.

See [docs/troubleshooting.md](./docs/troubleshooting.md) for more help.

## Development

Project layout:

```text
BonsaiDesk/
|-- backend/    # FastAPI + SQLite
|-- frontend/   # React + Vite + TypeScript
|-- scripts/    # PowerShell automation
`-- docs/       # Documentation
```

Useful development commands:

```powershell
.\scripts\check.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\run-backend.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\run-frontend.ps1
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contributor guidelines.

## Transparency and Licenses

Bonsai Desk downloads assets directly from upstream sources:

| Asset | Source | License |
|-------|--------|---------|
| Bonsai Models | `prism-ml/Bonsai-8B-gguf`, `prism-ml/Bonsai-4B-gguf`, `prism-ml/Bonsai-1.7B-gguf` | Apache-2.0 |
| Prism Demo | `PrismML-Eng/Bonsai-demo` | Apache-2.0 |
| llama.cpp Fork | `PrismML-Eng/llama.cpp` | MIT |

## Roadmap

- Desktop packaging
- Broader multi-platform support beyond the current Windows-first workflow
- More automated frontend coverage around UI interaction flows
- Continued setup/runtime UX polish and benchmarking-oriented diagnostics

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

MIT License. See [LICENSE](./LICENSE) for details.
