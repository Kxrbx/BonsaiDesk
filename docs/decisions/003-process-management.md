# ADR 003: Process Management for Runtime Control

## Status

Accepted

## Context

Bonsai Desk needs to manage the llama-server process:
- Start the runtime on user request
- Stop the runtime gracefully
- Monitor process health
- Handle crashes and unexpected termination
- Clean up on application exit

Platform: Windows (primary target)

## Decision

### Process Lifecycle Management

Use **subprocess.Popen** with Windows Job Objects:

1. **Start**: subprocess.Popen with CREATE_NO_WINDOW flag
2. **Monitor**: PID file + periodic health checks via HTTP
3. **Stop**: taskkill command with /T /F flags
4. **Cleanup**: Windows Job Object ensures child termination

### Job Objects (Windows-specific)

Job Objects ensure that when the backend process exits:
- All child processes (llama-server) are automatically terminated
- Prevents orphaned processes consuming resources
- Implemented via ctypes to avoid external dependencies

### Health Monitoring

Two-level health check:
1. **Process Level**: Check if PID exists in tasklist
2. **Application Level**: HTTP GET /health on runtime

### Configuration Persistence

Runtime parameters stored in SQLite and applied:
- On startup (when user clicks "Start")
- As command-line arguments to llama-server

## Consequences

### Positive
- Reliable process cleanup on exit
- Clear process ownership
- HTTP health checks work across platforms
- No external dependencies for process management

### Negative
- Windows-specific Job Object code
- PID files can become stale
- taskkill is forceful (no graceful shutdown)
- Requires careful handling of edge cases

## Implementation

### Starting Runtime

```python
process = subprocess.Popen(
    command,
    cwd=runtime_dir,
    stdout=log_file,
    stderr=subprocess.STDOUT,
    creationflags=subprocess.CREATE_NO_WINDOW,
)
# Bind to Job Object for automatic cleanup
_bind_to_job_object(process)
# Save PID for later management
save_pid(process.pid)
```

### Stopping Runtime

```python
subprocess.run(
    ["taskkill", "/PID", str(pid), "/T", "/F"],
    capture_output=True,
)
remove_pid_file()
```

### Job Object Binding

```python
# Create Job Object with KILL_ON_JOB_CLOSE
job = CreateJobObject(None, None)
info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
SetInformationJobObject(job, JobObjectExtendedLimitInformation, info)
# Assign process to Job
AssignProcessToJobObject(job, process_handle)
```

## Alternatives Considered

### Python psutil Library
- **Pros**: Cross-platform, higher-level API
- **Cons**: Additional dependency, still needs special Windows handling

### Windows Services
- **Pros**: Proper Windows integration
- **Cons**: Requires admin rights, complex setup, overkill for user app

### Docker Containers
- **Pros**: Isolation, easy cleanup
- **Cons**: Requires Docker, heavy overhead, not typical for desktop apps

## References

- [Windows Job Objects](https://docs.microsoft.com/en-us/windows/win32/procthread/job-objects)
- [Python subprocess](https://docs.python.org/3/library/subprocess.html)
- [ctypes Documentation](https://docs.python.org/3/library/ctypes.html)
