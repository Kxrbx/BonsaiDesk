# Development Guide

Guide for contributors and developers working on Bonsai Desk.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Development Setup

### Prerequisites

Same as [Installation Guide](./installation.md), plus:
- Git configured with your identity
- Code editor (VS Code recommended)

### Initial Setup

```powershell
# Clone repository
git clone https://github.com/Kxrbx/BonsaiDesk.git
cd BonsaiDesk

# Run bootstrap
.\scripts\bootstrap.ps1

# Verify installation
.\scripts\check.ps1
```

### IDE Configuration

#### VS Code Extensions (Recommended)

- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense

#### VS Code Settings

```json
{
  "python.defaultInterpreterPath": "./.venv/Scripts/python.exe",
  "python.linting.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Project Structure

```
BonsaiDesk/
├── backend/
│   ├── app/
│   │   ├── api/           # REST route handlers
│   │   │   ├── routes_chat.py
│   │   │   ├── routes_conversations.py
│   │   │   ├── routes_models.py
│   │   │   └── routes_runtime.py
│   │   ├── core/          # Business logic
│   │   │   ├── chat_service.py
│   │   │   ├── runtime_manager.py
│   │   │   ├── config.py
│   │   │   └── schemas.py
│   │   ├── db/            # Persistence
│   │   │   └── storage.py
│   │   └── main.py        # FastAPI app
│   ├── tests/             # Unit tests
│   └── requirements.txt   # Python deps
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   ├── lib/           # Utilities
│   │   ├── types.ts       # TypeScript types
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
├── scripts/               # PowerShell scripts
├── docs/                  # Documentation
└── .github/               # GitHub templates
```

## Code Style

### Python (Backend)

Follow PEP 8 with these specifics:

#### Formatting
- Line length: 100 characters
- Use double quotes for strings
- Trailing commas in multi-line collections

#### Naming
- `snake_case` for variables, functions
- `PascalCase` for classes
- `UPPER_CASE` for constants

#### Imports
```python
# Standard library
from typing import Optional
import asyncio

# Third-party
from fastapi import FastAPI
import httpx

# Local
from app.core.config import settings
```

#### Type Hints
Always use type hints:
```python
def process_message(content: str, max_tokens: int = 2048) -> dict[str, str]:
    ...
```

#### Docstrings
Use Google-style docstrings:
```python
def start_runtime(gpu_layers: int) -> RuntimeInfo:
    """Start the llama-server runtime.
    
    Args:
        gpu_layers: Number of layers to offload to GPU.
        
    Returns:
        RuntimeInfo with process details.
        
    Raises:
        RuntimeError: If runtime fails to start.
    """
```

### TypeScript (Frontend)

#### Formatting
- 2 spaces indentation
- Semicolons required
- Single quotes for strings

#### Naming
- `camelCase` for variables, functions
- `PascalCase` for components, types, interfaces
- `UPPER_CASE` for constants

#### Component Structure
```typescript
// Imports
import React, { useState } from 'react';

// Types
interface Props {
  title: string;
}

// Component
export const MyComponent: React.FC<Props> = ({ title }) => {
  // State
  const [count, setCount] = useState(0);
  
  // Handlers
  const handleClick = () => {
    setCount(c => c + 1);
  };
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Count: {count}</button>
    </div>
  );
};
```

## Testing

### Backend Tests

```powershell
# Run all tests
cd backend
..\.venv\Scripts\python.exe -m unittest discover -s tests -v

# Run specific test
..\.venv\Scripts\python.exe -m unittest tests.test_app -v
```

#### Writing Tests

```python
import unittest
from app.core.chat_service import ChatService

class TestChatService(unittest.TestCase):
    def setUp(self):
        self.service = ChatService()
    
    def test_message_processing(self):
        result = self.service.process("Hello")
        self.assertIsNotNone(result)
        self.assertIn("content", result)
```

### Frontend Tests

```powershell
# Run tests (when implemented)
cd frontend
npm test
```

### Pre-Commit Checks

Always run before committing:

```powershell
.\scripts\check.ps1
```

This runs:
1. Frontend production build
2. Backend unit tests

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build, dependencies, etc.

### Examples

```
feat(runtime): add GPU layer detection

Automatically detect optimal GPU layers based on
available VRAM. Falls back to CPU if detection fails.

fix(chat): resolve streaming interruption on long responses

Increase buffer size and add retry logic for
connection resets during streaming.

docs(readme): add troubleshooting section

Include common PowerShell execution policy issues
and their solutions.
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Refactoring

Examples:
- `feature/model-size-switching`
- `fix/runtime-startup-race-condition`
- `docs/api-reference`

## Pull Request Process

### Before Creating PR

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Run check script**: `.\scripts\check.ps1`
4. **Update CHANGELOG.md** for user-facing changes

### PR Template

Fill out the [PR template](../.github/pull_request_template.md):

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How you tested these changes

## Screenshots (if UI changes)
```

### Review Process

1. All checks must pass (CI)
2. At least one review required
3. Address review comments
4. Squash commits if requested

### Areas Needing Extra Care

When modifying these areas, test thoroughly:

- **Runtime installation and launch flows**
- **Conversation persistence**
- **Streaming behavior and error states**
- **Runtime settings persistence**
- **Prism compatibility**

## Debugging

### Backend Debugging

```powershell
# Run with auto-reload
cd backend
..\.venv\Scripts\uvicorn.exe app.main:app --reload

# Enable debug logging
$env:LOG_LEVEL = "DEBUG"
.\scripts\run-backend.ps1
```

### Frontend Debugging

```powershell
# Start with source maps
cd frontend
npm run dev

# Access React DevTools in browser
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Import errors | Check virtual environment is activated |
| CORS errors | Verify backend is running on correct port |
| Hot reload fails | Restart dev server |

## Release Process

1. Update version in relevant files
2. Update CHANGELOG.md
3. Create git tag: `git tag v0.2.0`
4. Push tag: `git push origin v0.2.0`
5. Create GitHub release with notes

## Getting Help

- Check [existing issues](https://github.com/Kxrbx/BonsaiDesk/issues)
- Ask in discussions
- Tag @Kxrbx for architecture questions
