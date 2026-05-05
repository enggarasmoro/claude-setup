## Logging and Observability Principles

> **⚠️ Prerequisite:** All operations MUST be logged per Logging and Observability Mandate logging-and-observability-mandate.md. This guide provides implementation patterns only.

### Logging Standards

#### Log Levels (Standard Priority)

| Level     | When to Use                             | Examples                                                 |
| --------- | --------------------------------------- | -------------------------------------------------------- |
| **TRACE** | Extremely detailed diagnostic info      | Function entry/exit, variable states (dev only)          |
| **DEBUG** | Detailed flow for debugging             | Query execution, cache hits/misses, state transitions    |
| **INFO**  | General informational messages          | Request started, task created, user logged in            |
| **WARN**  | Potentially harmful situations          | Deprecated API usage, fallback triggered, retry attempt  |
| **ERROR** | Error events that allow app to continue | Request failed, external API timeout, validation failure |
| **FATAL** | Severe errors causing shutdown          | Database unreachable, critical config missing            |

#### Logging Rules

**1. Every request/operation must log start, success, and error** with structured key-value context:
```
log.Info("creating task", "correlationId", correlationID, "userId", userID, "title", task.Title)
log.Info("task created successfully", "correlationId", correlationID, "taskId", task.ID, "duration", time.Since(start))
log.Error("failed to create task", "correlationId", correlationID, "error", err, "userId", userID)
```

**2. Always include context:** `correlationId` (UUID, traces requests across services), `userId` (actor), `duration` (ms), `error` (on failure).

**3. Structured logging only** — no string formatting (`fmt.Sprintf`).

**4. Security — Never log:**
- Passwords or password hashes
- API keys or tokens
- Credit card numbers
- PII in production logs (email/phone only if necessary and sanitized)
- Full request/response bodies (unless DEBUG level in non-prod)

**5. Performance — Never log in hot paths:**
- Inside tight loops
- Per-item processing in batch operations (use summary instead)
- Synchronous logging in latency-critical paths

**Best practice:** Use logger middleware redaction (pino-redact, zap masking) rather than manual string manipulation.

#### Language-Specific Implementations

- **Go:** `log/slog` with `slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})` — use `logger.Info("op started", "correlationId", id, "userId", userID)`.
- **TypeScript/Node.js:** `pino` — `logger.info({ correlationId, userId, duration }, 'task created')`.
- **Python:** `structlog` — `logger.info("task_created", correlation_id=cid, user_id=uid)`.

#### Log Patterns by Operation Type

- **API request/response:** INFO on receive (`method`, `path`, `correlationId`, `userId`); INFO on complete (`status`, `duration`).
- **Database:** DEBUG on query start/success (with `rowsReturned`, `duration`); ERROR on query failure (with `error`, `query`).
- **External API calls:** INFO on call; WARN on retry (`attempt`, `error`); WARN on circuit breaker open (`failureCount`).
- **Background jobs:** INFO on start (`jobId`, `jobType`); INFO periodic progress (`processed`, `total`, `percentComplete`) — never per-item; INFO on complete (`duration`, `itemsProcessed`).
- **Errors:** ERROR for recoverable (with sanitized input); FATAL for critical dependency unavailable (then shut down).

#### Environment-Specific Configuration

| Environment     | Level | Format           | Destination             |
| --------------- | ----- | ---------------- | ----------------------- |
| **Development** | DEBUG | Pretty (colored) | Console                 |
| **Staging**     | INFO  | JSON             | Stdout → CloudWatch/GCP |
| **Production**  | INFO  | JSON             | Stdout → CloudWatch/GCP |

Switch handler/level based on `ENV` env var (e.g., `slog.NewTextHandler` for dev, `slog.NewJSONHandler` for staging/prod).

#### Testing Logs

Capture logger output in unit tests and assert on structured content:
```go
var buf bytes.Buffer
logger := slog.New(slog.NewJSONHandler(&buf, nil))
// ... run operation ...
assert.Contains(t, buf.String(), "user login successful")
```

#### Monitoring Integration

**Correlation IDs:**
- Generate at ingress (API gateway, first handler)
- Propagate through all services
- Include in all logs, errors, and traces
- Format: UUID v4

**Log aggregation:**
- Ship to centralized system (CloudWatch, GCP Logs, Datadog)
- Index by: correlationId, userId, level, timestamp
- Alert on ERROR/FATAL patterns
- Dashboard: request rates, error rates, latency

#### Checklist for Every Feature

- [ ] All public operations log INFO on start
- [ ] All operations log INFO/ERROR on complete/failure
- [ ] All logs include correlationId
- [ ] No sensitive data in logs
- [ ] Structured logging (key-value pairs)
- [ ] Appropriate log level used
- [ ] Error logs include error details
- [ ] Performance-critical paths use DEBUG level

### Related Principles
- Logging and Observability Mandate logging-and-observability-mandate.md
- Monitoring and Alerting Principles monitoring-and-alerting-principles.md
- Error Handling Principles error-handling-principles.md
- Security Mandate security-mandate.md
- Security Principles security-principles.md
- API Design Principles api-design-principles.md
