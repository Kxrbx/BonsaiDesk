# Configuration Guide

Complete reference for configuring Bonsai Desk through environment variables.

## Table of Contents

- [Configuration Methods](#configuration-methods)
- [Core Settings](#core-settings)
- [Runtime Configuration](#runtime-configuration)
- [Model Configuration](#model-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Advanced Settings](#advanced-settings)
- [Runtime Parameters](#runtime-parameters)

## Configuration Methods

### Method 1: Environment Variables (Recommended)

Set variables in your PowerShell session or system environment:

```powershell
# Temporary (current session only)
$env:BONSAI_DESK_HOME = "D:\BonsaiData"

# Permanent (user level)
[Environment]::SetEnvironmentVariable("BONSAI_DESK_HOME", "D:\BonsaiData", "User")

# Permanent (system level - requires admin)
[Environment]::SetEnvironmentVariable("BONSAI_DESK_HOME", "D:\BonsaiData", "Machine")
```

### Method 2: `.env` File

Create a `.env` file in the project root:

```powershell
copy .env.example .env
notepad .env
```

Variables in `.env` are loaded automatically when the backend starts.

### Method 3: Direct Configuration (UI)

Some settings can be configured through the Runtime Panel in the UI.

## Core Settings

### `BONSAI_DESK_HOME`

**Default**: `%USERPROFILE%\.bonsai-desk\` (Windows)

Override the default app data directory. This is where:
- Conversations are stored (SQLite database)
- Runtime settings are saved
- Downloaded models are cached

**Example**:
```env
BONSAI_DESK_HOME=D:\BonsaiDesk\Data
```

### `PRISM_LAUNCHER_HOME`

**Default**: Same as `BONSAI_DESK_HOME`

Legacy alias for backward compatibility. If you previously used Prism Launcher, this ensures data migration.

## Runtime Configuration

### `PRISM_LLAMA_SERVER_PATH`

**Default**: Auto-detected

Path to a custom `llama-server.exe` executable. Use this if you:
- Built llama.cpp from source
- Have a specific version you want to use
- Want to use a runtime outside the managed directory

**Example**:
```env
PRISM_LLAMA_SERVER_PATH=C:\Tools\llama.cpp\llama-server.exe
```

### `PRISM_LLAMA_CPP_ZIP_URL`

**Default**: Official Prism release

URL to a custom runtime archive (zip file). The archive should contain `llama-server.exe`.

**Example**:
```env
PRISM_LLAMA_CPP_ZIP_URL=https://github.com/PrismML-Eng/llama.cpp/releases/download/custom-build/llama-prism-win.zip
```

### `PRISM_LLAMA_RELEASE_TAG`

**Default**: `prism-b8194-1179bfc`

GitHub release tag for downloading the runtime.

### `PRISM_LLAMA_ASSET_SUFFIX`

**Default**: `1179bfc`

Asset filename suffix for the release.

### `PRISM_LLAMA_RELEASE_BASE`

**Default**: `https://github.com/PrismML-Eng/llama.cpp/releases/download`

Base URL for Prism runtime releases.

### `PRISM_RUNTIME_HOST`

**Default**: `127.0.0.1`

Host address for the llama-server runtime.

### `PRISM_RUNTIME_PORT`

**Default**: `8080`

Port for the llama-server runtime. Change this if port 8080 is already in use.

**Example**:
```env
PRISM_RUNTIME_PORT=8081
```

## Model Configuration

### `PRISM_MODEL_URL`

**Default**: `https://huggingface.co/prism-ml/Bonsai-8B-gguf/resolve/main/Bonsai-8B.gguf?download=true`

URL to download the GGUF model file. Can be any direct download URL.

**Example** (using a different model size when available):
```env
PRISM_MODEL_URL=https://huggingface.co/prism-ml/Bonsai-4B-gguf/resolve/main/Bonsai-4B.gguf?download=true
```

### `PRISM_MODEL_FILENAME`

**Default**: `Bonsai-8B.gguf`

Filename for the downloaded model. Should match the actual filename in the URL.

### `PRISM_BONSAI_MODEL_SIZE`

**Default**: `8B`

Model size identifier. Used for UI labeling and future multi-model support.

**Values**: `8B`, `4B`, `1.7B` (when available)

## Frontend Configuration

### `VITE_API_BASE_URL`

**Default**: `http://127.0.0.1:8000`

Override the backend API base URL. Useful for:
- Non-standard deployments
- Reverse proxy setups
- Development with different ports

**Example**:
```env
VITE_API_BASE_URL=http://192.168.1.100:8000
```

## Advanced Settings

### Runtime Resolution Priority

When Bonsai Desk looks for a runtime, it checks in this order:

1. **UI-linked runtime** - Path set through the web interface
2. **Managed runtime** - Downloaded and managed by Bonsai Desk
3. **`PRISM_LLAMA_SERVER_PATH`** - Environment variable
4. **Official release metadata** - From GitHub API
5. **`PRISM_LLAMA_CPP_ZIP_URL`** - Custom archive URL
6. **PATH lookup** - `llama-server.exe` found in system PATH

### Data Directory Structure

```
.bonsai-desk/
├── bonsai_desk.db          # SQLite database (conversations, settings)
├── runtime/
│   └── llama-server.exe    # Managed runtime executable
└── models/
    └── Bonsai-8B.gguf      # Downloaded model file
```

## Runtime Parameters

These parameters can be configured through the Runtime Panel UI:

### Inference Parameters

| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| **Temperature** | Randomness of output | 0.0 - 2.0 (0.7 default) |
| **Top-K** | Limit vocabulary to top K tokens | 1 - 100 (40 default) |
| **Top-P** | Nucleus sampling threshold | 0.0 - 1.0 (0.9 default) |
| **Min-P** | Minimum probability threshold | 0.0 - 1.0 (0.05 default) |
| **Max Tokens** | Maximum response length | 1 - 4096 (2048 default) |
| **Context Size** | Token context window | 512 - 32768 (4096 default) |

### System Parameters

| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| **GPU Layers** | Layers to offload to GPU | 0 - 50 (0 = CPU only) |
| **Threads** | CPU threads for inference | 1 - 16 (4 default) |
| **Batch Size** | Processing batch size | 1 - 1024 |

### Reasoning Parameters

| Parameter | Description | Options |
|-----------|-------------|---------|
| **Reasoning Budget** | Tokens allocated for reasoning | 0 - 4096 |
| **Reasoning Format** | Output format for reasoning | `raw`, `parsed` |
| **Thinking Mode** | Enable thinking/reasoning | `enabled`, `disabled` |

### System Prompt

Customize the system prompt to change the AI's behavior:

**Default**:
```
You are a helpful AI assistant powered by the Bonsai model.
```

**Custom examples**:
```
You are an expert Python programmer. Provide concise, efficient code solutions.
```

```
You are a creative writing assistant. Help brainstorm ideas and develop characters.
```

### Presets

The UI provides three quick presets:

| Preset | Use Case | Characteristics |
|--------|----------|-----------------|
| **Demo** | Quick testing | Lower quality, faster |
| **Power** | Balanced usage | Good quality, reasonable speed |
| **Max** | Best quality | Highest quality, slower |

## Environment Variable Reference Table

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BONSAI_DESK_HOME` | No | `~\.bonsai-desk\` | App data directory |
| `PRISM_LAUNCHER_HOME` | No | Same as above | Legacy data directory |
| `PRISM_LLAMA_SERVER_PATH` | No | Auto-detected | Custom runtime path |
| `PRISM_LLAMA_CPP_ZIP_URL` | No | Official release | Custom runtime URL |
| `PRISM_LLAMA_RELEASE_TAG` | No | `prism-b8194-1179bfc` | Release tag |
| `PRISM_LLAMA_ASSET_SUFFIX` | No | `1179bfc` | Asset suffix |
| `PRISM_LLAMA_RELEASE_BASE` | No | GitHub releases | Release base URL |
| `PRISM_MODEL_URL` | No | Bonsai-8B URL | Model download URL |
| `PRISM_MODEL_FILENAME` | No | `Bonsai-8B.gguf` | Model filename |
| `PRISM_BONSAI_MODEL_SIZE` | No | `8B` | Model size label |
| `PRISM_RUNTIME_HOST` | No | `127.0.0.1` | Runtime host |
| `PRISM_RUNTIME_PORT` | No | `8080` | Runtime port |
| `VITE_API_BASE_URL` | No | `http://127.0.0.1:8000` | API base URL |
