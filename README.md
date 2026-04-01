# Bonsai Desk

**Suggested GitHub repository name:** `bonsai-desk`

Local chat app for running `prism-ml/Bonsai-8B-gguf` on your own machine with a polished ChatGPT-like interface, a local Prism runtime manager, and persistent conversations.

## Why This Project Exists

Bonsai Desk packages the Bonsai + Prism local workflow into a product-shaped app instead of a loose collection of scripts.

It gives you:

- a clean chat interface designed for daily local use
- guided runtime and model installation
- a runtime control modal for tuning Prism/Bonsai settings
- local conversation history with no cloud dependency
- a Windows-first setup that follows the public Bonsai demo runtime flow

## What It Includes

- `backend/`: FastAPI API, runtime orchestration, streaming proxy, SQLite persistence
- `frontend/`: React + Vite client with chat UI, setup screen, runtime modal, and conversation sidebar
- `scripts/`: bootstrap, dev launch, and local verification scripts
- `.github/`: CI workflow, issue templates, and PR template for GitHub sharing

## Current Product Scope

Bonsai Desk is currently built for:

- local single-user usage
- Windows development and runtime flow
- Prism-powered `llama-server`
- Bonsai GGUF models, starting with `Bonsai-8B.gguf`

By default the app stores state in `.bonsai-desk/`. If an older `.prism-launcher/` directory already exists, Bonsai Desk reuses it automatically for compatibility, including the legacy `prism_launcher.db` database and older UI preference keys.

## Feature Highlights

- ChatGPT-like chat layout with conversation history
- local runtime install/start/stop flow
- streaming responses
- persistent runtime parameters across sessions
- runtime presets: `demo`, `power`, `max`
- runtime logs and health feedback
- support for Prism-specific options such as thinking mode and reasoning format

## Quick Start

1. Optionally copy values from [.env.example](./.env.example)
2. Install dependencies:

```powershell
.\scripts\bootstrap.ps1
```

3. Start the app in development:

```powershell
.\scripts\run-dev.ps1
```

4. Open `http://127.0.0.1:5173`
5. Install or start the local runtime from the setup flow

You can also launch backend + frontend windows and open the browser with:

```powershell
.\launch-app.bat
```

## Runtime Notes

Runtime resolution order:

1. managed runtime already installed by Bonsai Desk
2. `PRISM_LLAMA_SERVER_PATH`
3. official Prism/Bonsai demo release metadata
4. `PRISM_LLAMA_CPP_ZIP_URL`
5. `llama-server.exe` found on `PATH`

Default model source:

- repo: `prism-ml/Bonsai-8B-gguf`
- file: `Bonsai-8B.gguf`
- URL: `https://huggingface.co/prism-ml/Bonsai-8B-gguf/resolve/main/Bonsai-8B.gguf?download=true`

The setup screen also lets users link an existing local `llama-server.exe` and `.gguf` model instead of downloading them again.

## Sources And Licenses

Bonsai Desk downloads official assets directly from their upstream sources and does not re-host them:

- Bonsai model card: `prism-ml/Bonsai-8B-gguf` on Hugging Face, license shown as `Apache-2.0`
- Prism Bonsai demo repo: `PrismML-Eng/Bonsai-demo`, license shown as `Apache-2.0`
- Prism `llama.cpp` fork: `PrismML-Eng/llama.cpp`, license shown as `MIT`

The setup screen makes this explicit before official downloads start, and also offers a separate flow to link an existing local runtime/model without copying those files into the app.

Users remain responsible for complying with the upstream licenses and usage terms of the downloaded assets.

## Runtime Controls In The UI

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

The UI separates request-time parameters from runtime-start parameters where that distinction matters.

## Configuration

Useful variables:

- `BONSAI_DESK_HOME`: override the app data directory
- `PRISM_LAUNCHER_HOME`: legacy app-home alias still supported
- `PRISM_LLAMA_SERVER_PATH`: point to an existing Prism-compatible `llama-server.exe`
- `PRISM_LLAMA_CPP_ZIP_URL`: use a custom runtime archive
- `VITE_API_BASE_URL`: override the frontend API base for nondefault deployments

See [.env.example](./.env.example) for the current full list.

## Local Verification

Run before sharing changes:

```powershell
.\scripts\check.ps1
```

This runs backend tests and a production frontend build.

## GitHub Publishing

Recommended repository:

- name: `bonsai-desk`
- description: `Local Prism-powered chat app for Bonsai GGUF models`

Suggested initial flow:

```powershell
git init
git branch -M main
git add .
git commit -m "Initial Bonsai Desk import"
git remote add origin https://github.com/<your-user>/bonsai-desk.git
git push -u origin main
```

## Known Limitations

- Windows is the primary target today
- one active local runtime instance
- no desktop packaging yet
- no multi-user or hosted deployment flow yet

## Roadmap

- add Bonsai model-size switching (`8B / 4B / 1.7B`)
- improve runtime install transparency and diagnostics
- continue UI polish and responsive behavior work
- add stronger frontend coverage around runtime state and streaming flows

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
