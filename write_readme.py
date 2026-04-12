import os

readme_content = """# Bonsai Desk

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
- [Step-by-Step Setup Tutorial](#step-by-step-setup-tutorial)
  - [Before You Start: Install Prerequisites](#before-you-start-install-prerequisites)
  - [Step 1: Download Bonsai Desk](#step-1-download-bonsai-desk)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Launch the Application](#step-3-launch-the-application)
  - [Step 4: First-Time Setup Wizard](#step-4-first-time-setup-wizard)
  - [Step 5: Start Chatting!](#step-5-start-chatting)
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

## Step-by-Step Setup Tutorial

Get up and running with Bonsai Desk in about 10 minutes. This tutorial walks you through each step with explanations of what to expect.

### Before You Start: Install Prerequisites

First, make sure you have the required software installed on your computer.

#### 1.1 Download and Install Python

Python is the programming language the backend runs on.

1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Click the "Download Python" button
3. Run the installer
4. **Important**: Check the box "Add Python to PATH" at the bottom of the installer
5. Click "Install Now"

**Verify Python is installed:**
```powershell
python --version
```
You should see something like `Python 3.12.0`.

#### 1.2 Download and Install Node.js

Node.js runs the frontend interface.

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version (the big button on the left)
3. Run the installer with default settings
4. Restart your terminal/PowerShell after installation

**Verify Node.js is installed:**
```powershell
node --version
npm --version
```
You should see version numbers like `v20.10.0` and `10.2.0`.

#### 1.3 Download and Install Git

Git is used to download the Bonsai Desk project.

1. Go to [git-scm.com/download/win](https://git-scm.com/download/win)
2. Download the installer
3. Run with default settings (click "Next" through the wizard)

**Verify Git is installed:**
```powershell
git --version
```
You should see something like `git version 2.43.0`.

> **Note**: If you already have Python, Node.js, and Git installed, you can skip to the next section!

---

### Step 1: Download Bonsai Desk

Open PowerShell (search for "PowerShell" in the Start menu) and run:

```powershell
git clone https://github.com/Kxrbx/BonsaiDesk.git
cd BonsaiDesk
```

**What just happened?**
- Git downloaded the Bonsai Desk project to a new folder
- You are now inside the `BonsaiDesk` folder
- You should see the folder contents when you run `dir`

---

### Step 2: Install Dependencies

Run the bootstrap script to install all required packages:

```powershell
.\scripts\bootstrap.ps1
```

**What just happened?**
- A Python virtual environment (`.venv`) was created to keep dependencies isolated
- Python packages (FastAPI, SQLAlchemy, etc.) were installed for the backend
- Node packages (React, Vite, etc.) were installed for the frontend
- This takes 2-5 minutes depending on your internet speed

**Expected output:**
```
Bootstrap complete.
```

> **Note**: The first time you run this, Windows may ask "Do you want to allow this app?" - click Yes.

---

### Step 3: Launch the Application

There are two ways to start Bonsai Desk:

**Option A: One-Click Launcher (Recommended)**
```powershell
.\launch-app.bat
```

**Option B: Manual Start**
```powershell
.\scripts\run-dev.ps1
```

**What just happened?**
- Two new PowerShell windows opened (keep them open!)
  - One says "Bonsai Desk Backend" - this runs the API server
  - One says "Bonsai Desk Frontend" - this runs the web interface
- Your browser should automatically open to `http://127.0.0.1:5173`

**What you should see:**
A browser window with the Bonsai Desk interface, likely showing a welcome screen or setup wizard.

> **Keep these windows open!** Closing them will stop the application.

---

### Step 4: First-Time Setup Wizard

The first time you run Bonsai Desk, you'll need to set up the AI runtime and model. The app will guide you through this.

#### Step 4a: Choose Your Setup Option

You'll see two options:

**Option A: Download Official Assets (Recommended)**
- Click "Download Official Assets"
- Review and accept the license information
- Click "Download" to fetch:
  - The Prism runtime (`llama-server.exe`) - ~50 MB
  - The Bonsai AI model (`Bonsai-8B.gguf`) - ~5 GB
- Wait for both downloads to complete (this takes a few minutes)

**Option B: Use Local Files**
- Click "Use Local Files" if you already have:
  - A Prism-compatible `llama-server.exe`
  - A `.gguf` model file
- Browse to select your files
- Click "Link Files"

#### Step 4b: Start the Runtime

Once files are ready:
1. Click "Start Runtime" button
2. Wait for the runtime indicator to turn green
3. The status should show "Running"

**What the runtime indicator looks like:**
- :red_circle: Red = Not running
- :yellow_circle: Yellow = Starting
- :green_circle: Green = Running and ready

---

### Step 5: Start Chatting!

You're all set! Here's how to use Bonsai Desk:

1. **Create a new conversation**: Click "New Chat" in the sidebar
2. **Type your message**: Enter text in the input box at the bottom
3. **Send**: Press Enter or click the Send button
4. **Wait for response**: Watch the AI "think" and stream its response

**Example first message to try:**
```
Hello! Can you explain what you are?
```

---

### Quick Reference: Common Tasks

| Task | How to Do It |
|------|--------------|
| Start Bonsai Desk | Run `.\launch-app.bat` |
| Stop Bonsai Desk | Close the Backend and Frontend windows |
| Clear conversation | Click "New Chat" in sidebar |
| Adjust AI settings | Click "Runtime Panel" and modify parameters |
| Check if running | Look for green indicator in top-right |

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

### Setup Flex
ibility
- Official Download: Fetch from Prism/Bonsai upstream sources
- Local Files: Link existing llama-server.exe and .gguf models

---

## Documentation

For detailed information, see the docs folder:

| Document | Description |
|----------|-------------|
| [Installation Guide](./docs/installation.md) | Detailed setup instructions |
| [Configuration](./docs/configuration.md) | Environment variables and settings |
| [Usage Guide](./docs/usage.md) | Using the chat interface |
| [Troubleshooting](./docs/troubleshooting.md) | Common issues and solutions |
| [Architecture](./docs/architecture.md) | System design and data flow |
| [API Reference](./docs/api.md) | Backend API documentation |
| [Development](./docs/development.md) | Contributing and development setup |

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

If you have multiple runtime options available, Bonsai Desk uses this priority:

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
If this fails, [reinstall Python](#11-download-and-install-python) with "Add to PATH" checked.

### Node.js Not Found
```powershell
node --version
```
If this fails, [reinstall Node.js](#12-download-and-install-nodejs).

### Port Already in Use
If port 8080 is occupied, you will see an error. Fix it by creating a `.env` file:
```powershell
copy .env.example .env
notepad .env
```
Change this line:
```
PRISM_RUNTIME_PORT=8080
```
To:
```
PRISM_RUNTIME_PORT=8081
```

### Runtime Won't Start
- Ensure the model file downloaded completely (check file size is ~5 GB)
- Try reducing GPU layers in Runtime Panel
- Check Windows Security/antivirus isn't blocking `llama-server.exe`

### Out of Memory
- Reduce GPU layers in Runtime Panel
- Reduce context size
- Close other applications
- Consider using system RAM instead of GPU

### Browser Shows Blank Page
- Wait 30 seconds for services to fully start
- Refresh the page (F5)
- Check both backend and frontend windows for error messages
- Verify port 5173 isn't blocked by firewall

See [docs/troubleshooting.md](./docs/troubleshooting.md) for more solutions.

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
"""

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme_content)
print('README.md written successfully')
