# Configuration Guide

Configuration reference for Bonsai Desk `0.3.0`.

## Configuration Sources

You can configure Bonsai Desk in three ways:

- Environment variables in your shell
- A local `.env` file in the project root
- Runtime settings saved from the UI

Environment variables are loaded when the backend starts. UI runtime settings are persisted in SQLite and reused across sessions.

## Core Paths

### `BONSAI_DESK_HOME`

**Default**: `<project>/.bonsai-desk`

Directory used for the database, managed runtime files, managed model files, and logs.

```env
BONSAI_DESK_HOME=D:\BonsaiDesk\Data
```

### `PRISM_LAUNCHER_HOME`

Legacy compatibility alias. If `BONSAI_DESK_HOME` is not set and an old `.prism-launcher/` directory exists, Bonsai Desk reuses it.

## Runtime Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRISM_LLAMA_SERVER_PATH` | Auto-detected | Explicit path to a Prism-compatible `llama-server.exe` |
| `PRISM_LLAMA_CPP_ZIP_URL` | Unset | Custom runtime zip URL containing `llama-server.exe` |
| `PRISM_LLAMA_RELEASE_TAG` | `prism-b8194-1179bfc` | Prism runtime release tag |
| `PRISM_LLAMA_ASSET_SUFFIX` | `1179bfc` | Prism asset filename suffix |
| `PRISM_LLAMA_RELEASE_BASE` | Prism GitHub releases URL | Base URL used to build official runtime downloads |
| `PRISM_RUNTIME_HOST` | `127.0.0.1` | Runtime host |
| `PRISM_RUNTIME_PORT` | `8080` | Runtime port |

## Model Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRISM_MODEL_URL` | Bonsai 8B URL | Custom GGUF download URL |
| `PRISM_MODEL_FILENAME` | `Bonsai-8B.gguf` | Default model filename |
| `PRISM_BONSAI_MODEL_SIZE` | `8B` | Initial Bonsai variant (`8B`, `4B`, `1.7B`) |

For official Bonsai models, the Setup Wizard and Runtime Modal can switch between `8B`, `4B`, and `1.7B` directly. If you link a custom `.gguf` path, that linked model takes priority until you reselect an official variant.

## Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend origin used by the frontend |

## Runtime Resolution Priority

Runtime binary lookup order:

1. Runtime path linked in the UI
2. Runtime managed by Bonsai Desk
3. `PRISM_LLAMA_SERVER_PATH`
4. `PRISM_LLAMA_CPP_ZIP_URL` / official Prism release metadata during installation
5. `llama-server.exe` from your system `PATH`

Model lookup order:

1. Model path linked in the UI
2. Managed GGUF file for the selected Bonsai variant
3. Legacy environment defaults for `PRISM_MODEL_FILENAME` / `PRISM_MODEL_URL`

## Data Directory Layout

```text
.bonsai-desk/
|-- bonsai_desk.db
|-- runtime/
|   |-- bin/
|   |   `-- llama-server.exe
|   `-- llama-server.pid
|-- models/
|   |-- Bonsai-8B.gguf
|   |-- Bonsai-4B.gguf
|   `-- Bonsai-1.7B.gguf
`-- logs/
    `-- llama-server.log
```

## Runtime Parameters Saved in the UI

### Inference Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `temperature` | Sampling randomness | `0.6` |
| `top_k` | Top-k sampling limit | `40` |
| `top_p` | Nucleus sampling threshold | `0.92` |
| `min_p` | Minimum probability threshold | `0.05` |
| `max_tokens` | Maximum generated tokens per response | `1024` |
| `system_prompt` | System instruction prepended to chats | Local assistant prompt |

### Runtime Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ctx_size` | Context window passed to the runtime | `65536` |
| `gpu_layers` | Number of layers offloaded to GPU | `99` |
| `threads` | CPU thread count | `8` |
| `batch_size` | Prompt processing batch size | `2048` |
| `model_variant` | Active Bonsai variant | `8B` |
| `model_filename` | Active managed model filename | `Bonsai-8B.gguf` |
| `runtime_binary_path` | Linked runtime binary path | `""` |
| `model_file_path` | Linked GGUF model path | `""` |

### Reasoning Parameters

| Parameter | Description | Allowed Values |
|-----------|-------------|----------------|
| `reasoning_budget` | Bonsai thinking budget | `-1` unrestricted, `0` disabled |
| `reasoning_format` | Thinking output format | `parsed`, `raw` |
| `enable_thinking` | Enables `<think>` generation behavior | `true`, `false` |

## Presets

The Runtime Modal includes three presets:

| Preset | Intent |
|--------|--------|
| `Demo` | Faster and lighter |
| `Power` | Balanced quality and speed |
| `Max` | More aggressive runtime settings |

Preset application updates the local form first. Click **Save defaults** to persist the new values across sessions.
