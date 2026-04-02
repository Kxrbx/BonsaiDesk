# Contributing to Bonsai Desk

Thank you for your interest in contributing to Bonsai Desk! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Areas Needing Extra Care](#areas-needing-extra-care)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to a standard of professional and respectful interaction. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Windows 10/11
- Python 3.8+
- Node.js 18+
- PowerShell 5.1+
- Git

### Initial Setup

```powershell
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/BonsaiDesk.git
cd BonsaiDesk

# 3. Add upstream remote
git remote add upstream https://github.com/Kxrbx/BonsaiDesk.git

# 4. Install dependencies
.\scripts\bootstrap.ps1

# 5. Verify setup
.\scripts\check.ps1
```

### Development Environment

#### VS Code (Recommended)

Install these extensions:
- Python
- Pylance
- ESLint
- Prettier

#### Other Editors

Ensure your editor supports:
- Python type checking
- TypeScript/JavaScript linting
- Auto-formatting on save

## Development Workflow

### 1. Create a Branch

```powershell
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### 2. Make Changes

- Write code following our [style guidelines](#code-style-guidelines)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Locally

```powershell
# Run all checks
.\scripts\check.ps1

# Or run individually:
# Frontend build
cd frontend; npm run build

# Backend tests
cd ..\backend; ..\.venv\Scripts\python.exe -m unittest discover -s tests
```

### 4. Commit

```powershell
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add feature description"
```

See [commit message guidelines](#commit-message-guidelines) below.

### 5. Push and Create PR

```powershell
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## Code Style Guidelines

### Python (Backend)

- Follow PEP 8
- Line length: 100 characters
- Use type hints for all function signatures
- Use Google-style docstrings

Example:
```python
def process_message(content: str, max_tokens: int = 2048) -> dict[str, str]:
    """Process a chat message.
    
    Args:
        content: The message content.
        max_tokens: Maximum tokens in response.
        
    Returns:
        Dictionary with response data.
    """
    # Implementation
```

### TypeScript (Frontend)

- 2 spaces indentation
- Semicolons required
- Single quotes for strings
- PascalCase for components, camelCase for functions

Example:
```typescript
interface Props {
  title: string;
}

export const MyComponent: React.FC<Props> = ({ title }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>{title}</div>
  );
};
```

See [docs/development.md](./docs/development.md) for complete style guide.

## Testing

### Running Tests

```powershell
# Backend tests
cd backend
..\.venv\Scripts\python.exe -m unittest discover -s tests -v

# Frontend build test
cd ..\frontend
npm run build
```

### Writing Tests

- Add tests for new features
- Add tests for bug fixes
- Maintain or improve code coverage

Example test:
```python
import unittest
from app.core.chat_service import ChatService

class TestChatService(unittest.TestCase):
    def test_process_message(self):
        service = ChatService()
        result = service.process("Hello")
        self.assertIsNotNone(result)
```

## Commit Message Guidelines

Use conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build, dependencies

### Examples

```
feat(runtime): add GPU layer detection

Automatically detect optimal GPU layers based on
available VRAM.

fix(chat): resolve streaming interruption

Increase buffer size for long responses.

docs(readme): add troubleshooting section
```

## Pull Request Process

1. **Update documentation** if your changes affect usage
2. **Add tests** for new functionality
3. **Run `.\scripts\check.ps1`** and ensure all checks pass
4. **Fill out the PR template** completely
5. **Link related issues** with "Fixes #123"
6. **Request review** from maintainers

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Check script passes
- [ ] No local assets committed
- [ ] Commit messages follow conventions

## Areas Needing Extra Care

When modifying these areas, please test thoroughly:

### Runtime Installation and Launch
- Test both download and local file linking flows
- Test on fresh Windows installs
- Verify error handling for missing dependencies

### Conversation Persistence
- Verify data integrity across app restarts
- Test migration from legacy `.prism-launcher/`
- Check SQLite operations handle edge cases

### Streaming Behavior
- Test with long responses
- Verify error states (network, runtime crash)
- Check empty response handling

### Runtime Settings
- Verify persistence across sessions
- Test preset behavior
- Check parameter validation

### Prism Compatibility
- Ensure changes work with official Prism runtime
- Test with different model sizes when available
- Verify upstream license compliance

## What Not to Commit

Never commit:
- Runtime binaries (`llama-server.exe`)
- Model files (`.gguf`)
- Log files
- Temporary directories
- Virtual environment (`.venv/`)
- Node modules (`node_modules/`)
- Build outputs (`dist/`, `build/`)
- Local environment files (`.env`)

These are already in `.gitignore`.

## Getting Help

- **Documentation**: Check [docs/](./docs/) folder
- **Issues**: Search [existing issues](https://github.com/Kxrbx/BonsaiDesk/issues)
- **Discussions**: Use GitHub Discussions for questions
- **Direct**: Tag @Kxrbx for architecture questions

## Recognition

Contributors will be recognized in our release notes and README.

Thank you for contributing to Bonsai Desk!
