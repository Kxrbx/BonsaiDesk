# Development Guide

Guide for contributors working on Bonsai Desk.

## Setup

Install the same prerequisites listed in [installation.md](./installation.md), then run:

```powershell
git clone https://github.com/Kxrbx/BonsaiDesk.git
cd BonsaiDesk
.\install.bat
.\scripts\check.ps1
```

If you prefer PowerShell scripts directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
```

## Running Locally

```powershell
.\launch-app.bat
```

Or run each side manually:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-backend.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\run-frontend.ps1
```

## Project Structure

```text
BonsaiDesk/
|-- backend/
|   |-- app/
|   |   |-- api/           # FastAPI route handlers
|   |   |-- core/          # Runtime and chat logic
|   |   |-- db/            # SQLite persistence
|   |   `-- main.py        # FastAPI app entrypoint
|   |-- tests/
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |-- package.json
|   `-- vite.config.ts
|-- scripts/
|-- docs/
`-- .github/
```

## Checks and Tests

Run the full project check:

```powershell
.\scripts\check.ps1
```

Backend tests only:

```powershell
cd backend
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Frontend production build:

```powershell
cd frontend
npm run build
```

## Code Style

### Python
- Use type hints.
- Prefer `snake_case` for functions and variables, `PascalCase` for classes.
- Keep docstrings concise and useful.

### TypeScript
- Use `camelCase` for variables/functions and `PascalCase` for components/types.
- Keep components small and move reusable API/types logic into shared modules.

## Release Checklist

1. Update versions in `backend/app/main.py`, `frontend/package.json`, and `frontend/package-lock.json`.
2. Update [CHANGELOG.md](../CHANGELOG.md).
3. Run `.\scripts\check.ps1`.
4. Create and push a tag such as `v0.2.0`.
5. Draft a GitHub release.
