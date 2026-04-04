# Installation Guide

Complete guide for installing and setting up Bonsai Desk on Windows.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Post-Installation Setup](#post-installation-setup)
- [Verification](#verification)
- [Uninstallation](#uninstallation)

## Prerequisites

### System Requirements

#### Hardware

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **OS** | Windows 10 (1903+) | Windows 11 | 64-bit required |
| **CPU** | 4 cores | 8+ cores | AVX2 support recommended |
| **RAM** | 8 GB | 16 GB+ | Prefer 1.7B/4B on smaller machines, 8B for better quality |
| **GPU** | Integrated | NVIDIA 8GB+ VRAM | CUDA optional but faster |
| **Storage** | 4 GB free | 20 GB free | Depends on model variant; SSD recommended |
| **Internet** | 10 Mbps | 50+ Mbps | For model download |

#### Software

- **Python** 3.8 or higher
- **Node.js** 18 LTS or higher
- **PowerShell** 5.1 or higher (included in Windows)
- **Git** 2.30 or higher

### Installing Prerequisites

#### Python

1. Download from [python.org](https://www.python.org/downloads/)
2. Run installer
3. **Important**: Check "Add Python to PATH"
4. Verify: `python --version`

#### Node.js

1. Download LTS from [nodejs.org](https://nodejs.org/)
2. Run installer
3. Verify: `node --version` and `npm --version`

#### Git

1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Use default settings
3. Verify: `git --version`

#### PowerShell Execution Policy

If you encounter script execution errors:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Installation Methods

### Method 1: Clone from GitHub (Recommended for Development)

```powershell
# Clone the repository
git clone https://github.com/Kxrbx/BonsaiDesk.git

# Navigate to project folder
cd BonsaiDesk

# Easiest option
.\install.bat

# Manual fallback
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
```

The bootstrap script will:
1. Create a Python virtual environment (`.venv/`)
2. Install Python dependencies from `backend/requirements.txt`
3. Install Node.js dependencies in `frontend/`

### Method 2: Download Release (Coming Soon)

Desktop installers will be available in future releases.

## Post-Installation Setup

### Initial Configuration

1. **Review environment variables** (optional):
   ```powershell
   notepad .env.example
   ```

2. **Create custom `.env` file** (optional):
   ```powershell
   copy .env.example .env
   notepad .env
   ```

### First Run

Start the application:

```powershell
.\launch-app.bat
```

Or start the dev scripts directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-dev.ps1
```

### Setup Wizard

The first time you access the app (http://127.0.0.1:5173), you'll see the setup screen:

#### Option A: Official Download (Recommended)

1. Select the Bonsai variant you want (`8B`, `4B`, or `1.7B`)
2. Select "Download Official Assets"
3. Review the upstream sources and licenses
4. Click "Download" to fetch:
   - Prism `llama-server.exe` (~50 MB)
   - The selected Bonsai `.gguf` model (~1.16 GB for 8B, ~572 MB for 4B, ~248 MB for 1.7B)
5. Wait for downloads to complete
6. Click "Start Runtime"

#### Option B: Use Existing Files

1. Select "Use Local Files"
2. Browse to your existing:
   - `llama-server.exe` (Prism-compatible)
   - `.gguf` model file
3. Click "Link Files"
4. Click "Start Runtime"

> **Note**: Local files are not copied or moved. Bonsai Desk stores the paths only and marks them as linked assets.

## Verification

### Check Installation

```powershell
# Verify backend
cd backend
.\..\.venv\Scripts\python.exe -c "import fastapi; print('Backend OK')"

# Verify frontend
cd ..\frontend
npm list react
```

### Test Runtime

1. Open http://127.0.0.1:5173
2. Runtime indicator should show green ("Running")
3. Click "New Chat"
4. Type a test message
5. Verify streaming response

### Check Logs

If something doesn't work:

```powershell
# Backend logs are in the "Bonsai Desk Backend" terminal opened by launch-app.bat
# Runtime logs are visible in the UI (Runtime Modal)
# App data is in:
ls $env:USERPROFILE\.bonsai-desk\
```

## Uninstallation

To completely remove Bonsai Desk:

```powershell
# 1. Stop any running instances
# Press Ctrl+C in the terminal running the app

# 2. Remove project folder
cd ..
Remove-Item -Recurse -Force BonsaiDesk

# 3. Remove app data (optional - removes conversations and settings)
Remove-Item -Recurse -Force $env:USERPROFILE\.bonsai-desk\

# 4. Remove legacy data if present (optional)
Remove-Item -Recurse -Force $env:USERPROFILE\.prism-launcher\
```

## Troubleshooting Installation

See [Troubleshooting Guide](./troubleshooting.md) for:
- PowerShell execution policy issues
- Python/Node.js path problems
- Download failures
- Runtime startup errors
