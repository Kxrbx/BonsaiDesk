# ADR 001: SQLite for Local Data Persistence

## Status

Accepted

## Context

Bonsai Desk needs to persist:
- Conversation history (messages, metadata)
- Runtime configuration settings
- UI preferences

We evaluated several options:

### Option 1: SQLite
- **Pros**: Zero configuration, single file, Python standard library support, ACID compliant
- **Cons**: Not suitable for concurrent writes, limited scalability

### Option 2: JSON Files
- **Pros**: Human-readable, simple
- **Cons**: No query capabilities, corruption risk, no transactions

### Option 3: PostgreSQL/MySQL
- **Pros**: Full-featured, scalable
- **Cons**: Requires separate server setup, overkill for single-user local app

### Option 4: Embedded NoSQL (TinyDB, etc.)
- **Pros**: Simple API, document-oriented
- **Cons**: Less mature, fewer tools, unnecessary complexity

## Decision

We chose **SQLite** for the following reasons:

1. **Zero Configuration**: Works out of the box with no setup required
2. **Single File**: Easy to backup, move, or delete
3. **ACID Compliance**: Data integrity guarantees
4. **Python Native**: sqlite3 module in standard library
5. **Sufficient for Use Case**: Single-user local app doesn't need concurrent access
6. **Query Capabilities**: SQL for complex queries (search, filtering)

## Consequences

### Positive
- Simple deployment (no database server)
- Easy backups (copy single file)
- Strong data consistency
- Good performance for read-heavy workload

### Negative
- Limited to single-writer (acceptable for single-user app)
- No built-in migration system (must implement manually)
- File locking issues if multiple processes access simultaneously

## Migration Strategy

For schema changes:
1. Check current schema version on startup
2. Apply migrations in sequence
3. Maintain backward compatibility during transitions

Current schema version tracked in `user_version` pragma.

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Python sqlite3 Module](https://docs.python.org/3/library/sqlite3.html)
