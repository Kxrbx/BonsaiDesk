# Changelog

All notable changes to Bonsai Desk will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation suite (installation, configuration, usage, troubleshooting)
- Architecture documentation and API reference
- Expanded contributing guidelines with code style standards
- Security policy and vulnerability reporting process
- Code of Conduct for community interactions

### Changed
- Restructured README.md with table of contents and prerequisites section
- Improved navigation with detailed documentation index

## [0.1.0] - 2026-04-02

### Added
- Initial release of Bonsai Desk
- ChatGPT-style chat interface with streaming responses
- Runtime management (install/start/stop/restart)
- Guided setup flow for Prism runtime and Bonsai model
- Support for official downloads and local file linking
- Persistent conversation history with SQLite
- Runtime parameter controls (temperature, top-k, top-p, etc.)
- Presets for demo, power, and max configurations
- Runtime logs and health monitoring
- Windows PowerShell automation scripts
- FastAPI backend with REST API
- React + Vite + TypeScript frontend
- CI/CD workflow with GitHub Actions
- Issue and PR templates

### Technical
- FastAPI backend with streaming proxy
- SQLite persistence for conversations and settings
- Runtime resolution with multiple fallback strategies
- CORS configuration for local development
- Process management for llama-server lifecycle
- Environment-based configuration
- Backward compatibility with legacy `.prism-launcher/` directory

[Unreleased]: https://github.com/Kxrbx/BonsaiDesk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Kxrbx/BonsaiDesk/releases/tag/v0.1.0
