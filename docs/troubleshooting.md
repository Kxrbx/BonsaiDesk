# Troubleshooting Guide

Solutions to common issues when installing, configuring, or using Bonsai Desk.

## Installation Issues

### PowerShell Execution Policy

**Error**: cannot be loaded because running scripts is disabled

**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python Not Found

**Solutions**:
1. Reinstall Python with "Add to PATH" checked
2. Or add manually to PATH environment variable

### Bootstrap Script Fails

**Solutions**:
1. Check Python and Node are installed
2. Clear npm cache: npm cache clean --force
3. Try manual installation (see docs/installation.md)

## Runtime Issues

### Runtime Won't Start

**Solutions**:
1. Check if port 8080 is in use, change to 8081 in .env
2. Install Visual C++ Redistributable
3. Check antivirus isn't blocking `llama-server.exe`
4. Open the Runtime Modal or Setup Wizard and inspect the **Diagnostics** card
5. Verify the selected model file exists and isn't corrupted

### Out of Memory

**Solutions**:
1. Reduce GPU layers in the Runtime Modal
2. Reduce context size
3. Close other applications
4. Switch to Bonsai `4B` or `1.7B`

## Chat Issues

### No Response from AI

**Solutions**:
1. Check runtime is running (green indicator)
2. Open Runtime Modal -> Diagnostics and inspect failed checks
3. Check browser console (F12) for errors
4. Verify backend is responding: curl http://127.0.0.1:8000/health
5. Refresh the page

### Streaming Stops Mid-Response

**Solutions**:
1. Increase max tokens in the Runtime Modal
2. Increase context size
3. Check runtime logs for "context full" messages

## Getting Help

If issues persist:
1. Check logs in the Runtime Modal
2. Search existing GitHub issues
3. Create new issue with bug report template
4. Include: Windows version, Python version, error messages, reproduction steps
