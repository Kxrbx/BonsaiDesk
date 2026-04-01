# Bonsai Desk

[![CI](https://github.com/Kxrbx/BonsaiDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Kxrbx/BonsaiDesk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-a7f3c8.svg)](./LICENSE)

Local-first chat app for running `prism-ml/Bonsai-8B-gguf` with a polished ChatGPT-like interface, a built-in Prism runtime manager, and persistent conversation history.

Repo: `https://github.com/Kxrbx/BonsaiDesk`

<img width="1690" height="956" alt="image" src="https://github.com/user-attachments/assets/2cb464c3-60d8-4724-8dbd-5ad79587eb72" />

## What Bonsai Desk Does

Bonsai Desk turns the Bonsai + Prism local workflow into an actual product instead of a folder of scripts.

It gives you:

- a modern local chat UI with conversation history
- a guided setup flow for the Prism runtime and Bonsai GGUF model
- a runtime control modal for tuning inference parameters
- local persistence for settings and conversations
- support for both official downloads and already-existing local files

## Current Scope

This project is currently optimized for:

- Windows local usage
- a single local user
- Prism-powered `llama-server`
- Bonsai GGUF models, starting with `Bonsai-8B.gguf`

State is stored in `.bonsai-desk/` by default. If an older `.prism-launcher/` directory already exists, Bonsai Desk reuses it automatically for compatibility, including the legacy `prism_launcher.db` file and previous UI preference keys.

## Stack

- `backend/`: FastAPI API, runtime orchestration, streaming proxy, SQLite persistence
- `frontend/`: React + Vite client with chat UI, setup experience, and runtime modal
- `scripts/`: bootstrap, dev launch, and local verification scripts
- `.github/`: CI workflow, issue templates, and PR template

## Highlights

- ChatGPT-style chat experience
- streaming responses
- install/start/stop/restart runtime controls
- persistent runtime parameters across sessions
- presets for `demo`, `power`, and `max`
- runtime logs and health feedback
- setup flow with local file linking for `llama-server.exe` and `.gguf`

## Quick Start

1. Optionally review [.env.example](./.env.example)
2. Install dependencies:

```powershell
.\scripts\bootstrap.ps1
```

3. Start the app:

```powershell
.\scripts\run-dev.ps1
```

4. Open `http://127.0.0.1:5173`
5. Complete setup or link existing local assets

You can also start both windows and open the browser automatically with:

```powershell
.\launch-app.bat
```

## Setup Paths

Bonsai Desk supports two setup flows from the installation screen:

### 1. Official download flow

The app downloads upstream assets directly from the official Prism/Bonsai sources and shows their origin before the download starts.

### 2. Use existing local files

The app can link:

- an existing Prism-compatible `llama-server.exe`
- an existing local `.gguf` model

This does not copy or re-host those files. Bonsai Desk stores and uses the selected paths.

## Runtime Resolution Order

Runtime resolution currently prefers:

1. local runtime linked from the UI
2. managed runtime already installed by Bonsai Desk
3. `PRISM_LLAMA_SERVER_PATH`
4. official Prism/Bonsai demo release metadata
5. `PRISM_LLAMA_CPP_ZIP_URL`
6. `llama-server.exe` found on `PATH`

Default model source:

- repo: `prism-ml/Bonsai-8B-gguf`
- file: `Bonsai-8B.gguf`
- URL: `https://huggingface.co/prism-ml/Bonsai-8B-gguf/resolve/main/Bonsai-8B.gguf?download=true`

## Transparency, Sources, and Licenses

Bonsai Desk downloads official assets directly from their upstream sources and does not re-host them.

Current upstream sources referenced by the app:

- Bonsai model card: `prism-ml/Bonsai-8B-gguf` on Hugging Face, shown as `Apache-2.0`
- Prism Bonsai demo repo: `PrismML-Eng/Bonsai-demo`, shown as `Apache-2.0`
- Prism `llama.cpp` fork: `PrismML-Eng/llama.cpp`, shown as `MIT`

The setup screen makes this explicit before official downloads start and provides a separate local-linking flow for users who already have the runtime or model on disk.

Users remain responsible for complying with upstream licenses and terms for the downloaded assets.

## Runtime Controls

The UI currently exposes:

- system prompt
- temperature
- top-k
- top-p
- min-p
- max tokens
- context size
- GPU layers
- threads
- reasoning budget
- reasoning format
- thinking mode

Request-time parameters and runtime-start parameters are intentionally kept distinct where needed.

## Configuration

Useful environment variables:

- `BONSAI_DESK_HOME`: override the app data directory
- `PRISM_LAUNCHER_HOME`: legacy alias still supported
- `PRISM_LLAMA_SERVER_PATH`: point to an existing Prism-compatible `llama-server.exe`
- `PRISM_LLAMA_CPP_ZIP_URL`: use a custom runtime archive
- `VITE_API_BASE_URL`: override the frontend API base

See [.env.example](./.env.example) for the full list.

## Development

Run local verification before pushing:

```powershell
.\scripts\check.ps1
```

This runs backend tests and a production frontend build.

Contribution notes live in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Known Limitations

- Windows is the primary target
- one active local runtime instance
- no desktop packaging yet
- no multi-user or hosted deployment flow yet

## Roadmap

- add Bonsai model-size switching (`8B / 4B / 1.7B`)
- improve runtime diagnostics and install feedback
- continue UI polish and responsive cleanup
- add stronger frontend coverage around runtime state and streaming flows

## License

MIT. See [LICENSE](./LICENSE).
