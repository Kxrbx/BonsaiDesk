# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Bonsai Desk, please report it responsibly.

### How to Report

**Please do not open public issues for security vulnerabilities.**

Instead, report privately via:

1. **GitHub Security Advisory**: [Report a vulnerability](https://github.com/Kxrbx/BonsaiDesk/security/advisories/new)
2. **Email**: Contact the maintainer directly (see GitHub profile)

### What to Include

Your report should include:

- **Description**: Clear description of the vulnerability
- **Impact**: What could an attacker do?
- **Steps to Reproduce**: Detailed instructions
- **Affected Versions**: Which versions are vulnerable?
- **Mitigation**: Any workarounds you've identified
- **Proof of Concept**: If applicable (optional)

### Response Timeline

| Phase | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial Assessment | Within 1 week |
| Fix Development | Depends on severity |
| Public Disclosure | After fix is released |

### Security Considerations

#### Local-Only Design

Bonsai Desk is designed for local single-user use:

- API binds to localhost only (127.0.0.1)
- No authentication mechanisms
- No network exposure by default

**Implications**:
- Physical access to the machine = full access to the app
- No protection against local attackers
- Not suitable for multi-user or server deployments

#### Data Privacy

- All conversation data stored locally in SQLite
- No telemetry or analytics
- No cloud services (except model/runtime downloads)
- User has full control over all data

#### Runtime Security

The llama-server runtime:
- Runs as the current user
- Executes compiled native code
- Downloads binaries from GitHub releases

**Recommendations**:
- Keep Windows and drivers updated
- Use antivirus software
- Verify downloads when possible

#### Model Downloads

Models are downloaded from:
- Hugging Face (prism-ml/Bonsai-8B-gguf)
- GitHub Releases (PrismML-Eng/llama.cpp)

These are official upstream sources. Always verify:
- HTTPS connections
- File integrity when possible
- License compliance

### Best Practices for Users

1. **Keep software updated**: Apply updates promptly
2. **Secure your system**: Use standard Windows security practices
3. **Review downloads**: Verify model and runtime sources
4. **Backup data**: Regular backups of `.bonsai-desk/` directory
5. **Limit exposure**: Don't expose the app to untrusted networks

### Security Updates

Security updates will be:
- Released as patch versions (e.g., 0.1.1)
- Documented in CHANGELOG.md
- Announced via GitHub releases

### Acknowledgments

We thank the following security researchers who have responsibly disclosed vulnerabilities:

*None yet - be the first!*

---

Last updated: 2026-04-02
