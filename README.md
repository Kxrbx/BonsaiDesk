# Bonsai Desk

[![CI](https://github.com/Kxrbx/BonsaiDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Kxrbx/BonsaiDesk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-a7f3c8.svg)](./LICENSE)
[![Platform: Windows](https://img.shields.io/badge/platform-Windows-blue.svg)]()
[![Python: 3.8+](https://img.shields.io/badge/python-3.8+-3776ab.svg)]()
[![Node: 18+](https://img.shields.io/badge/node-18+-339933.svg)]()

Local-first chat app for running prism-ml/Bonsai-8B-gguf with a polished ChatGPT-like interface, a built-in Prism runtime manager, and persistent conversation history.

<img width="1690" height="956" alt="Bonsai Desk Interface" src="https://github.com/user-attachments/assets/2cb464c3-60d8-4724-8dbd-5ad79587eb72" />

---

## Table of Contents

- [What is Bonsai Desk?](#what-is-bonsai-desk)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Features](#features)
- [Documentation](#documentation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Roadmap](#roadmap)
- [License](#license)

---

## What is Bonsai Desk?

Bonsai Desk transforms the Bonsai + Prism local workflow into a polished product—no more folder of scripts.

**What you get:**

- Modern local chat UI with conversation history
- Guided setup flow for Prism runtime and Bonsai GGUF model
- Runtime control modal for tuning inference parameters
- Local persistence for settings and conversations
- Support for both official downloads and existing local files

### Current Scope

| Aspect | Support |
|--------|---------|
| Platform | Windows (primary) |
| Users | Single local user |
| Runtime | Prism-powered llama-server |
| Models | Bonsai GGUF (8B, with 4B/1.7B coming) |

State is stored in .bonsai-desk/ by default. If an older .prism-launcher/ directory exists, Bonsai Desk reuses it automatically for compatibility.

---

## Prerequisites

Before installing, ensure you have:

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10/11 | Windows 11 |
| RAM | 8 GB | 16 GB+ |
| GPU | Optional | NVIDIA with 8GB+ VRAM |
| Storage | 10 GB free | 20 GB free |

### Software Dependencies

- **Python** 3.8 or higher
- **Node.js** 18 or higher
- **PowerShell** 5.1 or higher
- **Git** (for cloning)

**Note:** Python and Node.js must be available in your system PATH.

---

## Quick Start

### 1. Clone and Setup

```powershell
git clone https://github.com/Kxrbx/BonsaiDesk.git
cd BonsaiDesk
```

### 2. Install Dependencies

```powershell
.\scripts\bootstrap.ps1
```

### 3. Start the Application

```powershell
.\scripts\run-dev.ps1
```

Or use the one-click launcher:

```powershell
.\launch-app.bat
```

### 4. Complete Setup

Open http://127.0.0.1:5173 and follow the guided setup.

---

## Features

### Chat Experience
- ChatGPT-style interface with streaming responses
- Persistent conversation history
- Message editing and regeneration

### Runtime Management
- One-click install/start/stop/restart
- Real-time logs and health monitoring
- Persistent parameters across sessions

### Inference Controls
- System prompt customization
- Temperature, top-k, top-p, min-p sampling
- Max tokens and context size
- GPU layers and thread count
- Reasoning budget and format options
- Presets: demo, power, max

### Setup Flexibility
- Official Download: Fetch from Prism/Bonsai upstream sources
- Local Files: Link existing llama-server.exe and .gguf models

---

## Documentation

For detailed information, see the docs folder:

| Document | Description |
|----------|-------------|
| Installation Guide | Detailed setup instructions |
| Configuration | Environment variables and settings |
| Usage Guide | Using the chat interface |
| Troubleshooting | Common issues and solutions |
| Architecture | System design and data flow |
| API Reference | Backend API documentation |
| Development | Contributing and development setup |

---

## Configuration

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| BONSAI_DESK_HOME | App data directory | .bonsai-desk/ |
| PRISM_LLAMA_SERVER_PATH | Path to custom llama-server.exe | Auto-detected |
| PRISM_MODEL_URL | Custom model download URL | Official Bonsai-8B |
| VITE_API_BASE_URL | Frontend API base URL | http://127.0.0.1:8000 |

See .env.example for the complete list.

### Runtime Resolution Order

1. Local runtime linked from UI
2. Managed runtime installed by Bonsai Desk
3. PRISM_LLAMA_SERVER_PATH environment variable
4. Official Prism/Bonsai demo release
5. PRISM_LLAMA_CPP_ZIP_URL custom archive
6. llama-server.exe on system PATH

---

## Troubleshooting

### PowerShell Execution Policy
If you see "cannot be loaded because running scripts is disabled":
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python Not Found
Ensure Python is in your PATH:
```powershell
python --version
```

### Port Already in Use
If port 8080 is occupied, set a different port in .env:
```env
PRISM_RUNTIME_PORT=8081
```

See docs/troubleshooting.md for more solutions.

---

## Development

### Project Structure

```
BonsaiDesk/
├── backend/          # FastAPI + SQLite
├── frontend/         # React + Vite + TypeScript
├── scripts/          # PowerShell automation
└── docs/             # Documentation
```

### Quick Commands

```powershell
# Run all checks before committing
.\scripts\check.ps1

# Start backend only
.\scripts\run-backend.ps1

# Start frontend only
.\scripts\run-frontend.ps1
```

See CONTRIBUTING.md for guidelines.

---

## Transparency and Licenses

Bonsai Desk downloads assets directly from upstream sources:

| Asset | Source | License |
|-------|--------|---------|
| Bonsai Model | prism-ml/Bonsai-8B-gguf | Apache-2.0 |
| Prism Demo | PrismML-Eng/Bonsai-demo | Apache-2.0 |
| llama.cpp Fork | PrismML-Eng/llama.cpp | MIT |

---

## Roadmap

- Bonsai model-size switching (8B / 4B / 1.7B)
- Improved runtime diagnostics
- UI polish and responsive cleanup
- Enhanced frontend test coverage
- Desktop packaging
- Multi-platform support

---

## License

MIT License - see LICENSE for details.
