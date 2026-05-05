## Go Idioms and Patterns

### Core Philosophy

Go favors simplicity, explicitness, and readability. Resist patterns from other languages. If it looks boring, it's probably idiomatic.

> **Scope:** Go-specific *coding idioms*. For file layout, see `project-structure-go-backend.md`. For test naming, see `testing-strategy.md`. For logging library, see `logging-and-observability-principles.md`.

---

### Error Handling

1. **Always return errors — never panic in library or business code.** `panic` is reserved for unrecoverable states. Use `recover` only at top-level goroutine boundaries.

2. **Wrap errors with context using `%w`** (preserves chain for `errors.Is`/`errors.As`)
   ```go
   // ✅
   return fmt.Errorf("creating task for user %s: %w", userID, err)
   // ❌ Loses chain
   return fmt.Errorf("creating task: %v", err)
   ```

3. **Use sentinel errors for expected branches**
   ```go
   var ErrNotFound = errors.New("not found")
   if errors.Is(err, ErrNotFound) { /* handle */ }
   ```

4. **Use typed errors for rich domain errors** (caller unwraps with `errors.As`)
   ```go
   type ValidationError struct { Field, Message string }
   func (e *ValidationError) Error() string { return ... }
   var ve *ValidationError
   if errors.As(err, &ve) { /* access ve.Field */ }
   ```

5. **Handle errors at the right level** — propagate until you have enough context; don't swallow or re-wrap twice.

---

### Interfaces

1. **Keep interfaces small** — one or two methods is ideal.
   ```go
   // ✅ Focused
   type Reader interface { Read(p []byte) (n int, err error) }
   // ❌ Monolithic FileManager with Read/Write/Delete/List/Stat
   ```

2. **"Accept interfaces, return structs"** — params accept interfaces, returns are concrete.

3. **Define interfaces where used, not where implemented.**
   ```go
   // task/storage.go — defined in consumer package
   type Storage interface { GetByID(ctx context.Context, id string) (*Task, error) }
   // postgres.go implements Storage — does NOT define it
   ```

4. **Implicit satisfaction is a feature** — don't use embedding to "implement" interfaces. No `implements` keyword needed.

---

### Goroutines and Channels

> For general concurrency principles, see `concurrency-and-threading-principles.md`.

1. **Always pass `context.Context` as the first parameter.**
   ```go
   func (s *Service) GetTask(ctx context.Context, id string) (*Task, error)
   ```

2. **Never start a goroutine without knowing how it will stop.**
   ```go
   go func() {
       for {
           select {
           case <-ctx.Done(): return
           case item := <-ch: process(item)
           }
       }
   }()
   ```

3. **Use `errgroup` for concurrent fan-out with error collection.**
   ```go
   g, ctx := errgroup.WithContext(ctx)
   g.Go(func() error { return fetchUsers(ctx) })
   if err := g.Wait(); err != nil { ... }
   ```

4. **Channels for ownership transfer; mutexes for shared state.**

5. **Close channels from the sender, never the receiver.**

---

### Naming Conventions

1. **Receiver names: short, first letter of the type** — `func (s *Service)`, not `svc` or `self`.
2. **Package names: short, lowercase, no underscores, no plurals** — `package task` (not `tasks`, not `task_service`).
3. **Acronyms all caps or all lowercase** — `userID`, `HTTPClient` (not `userId`, `HttpClient`).
4. **Unexported identifiers omit the type name** — keep private names terse.
5. **Don't stutter** — `task.Task` is fine; `task.TaskService` is not.

---

### Idiomatic Patterns

1. **Functional options for optional configuration**
   ```go
   type Option func(*Service)
   func WithTimeout(d time.Duration) Option { return func(s *Service) { s.timeout = d } }
   func NewService(store Storage, opts ...Option) *Service { ... }
   ```

2. **`defer` for cleanup — always use error-checked closures.** Every deferred call returning an error MUST check and log it. Bare `defer X.Close()` is forbidden — silent error discard hides resource-leak failures.

   ```go
   // ❌ NEVER
   defer rows.Close()
   // ✅ ALWAYS
   defer func() {
       if err := rows.Close(); err != nil {
           slog.Warn("failed to close rows", "error", err, "operation", "ListTasks")
       }
   }()
   ```

   **Transaction rollback** — guard against `sql.ErrTxDone`:
   ```go
   defer func() {
       if err := tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
           slog.Error("failed to rollback transaction", "error", err)
       }
   }()
   ```

   **HTTP response body** — drain then close:
   ```go
   defer func() {
       if _, err := io.Copy(io.Discard, resp.Body); err != nil {
           slog.Warn("failed to drain response body", "error", err)
       }
       if err := resp.Body.Close(); err != nil {
           slog.Warn("failed to close response body", "error", err)
       }
   }()
   ```

3. **Avoid `init()` functions** — they run implicitly and make testing harder; prefer explicit initialization in `main` or constructors.

4. **Prefer `struct` embedding over inheritance**, only when truly "is-a".

5. **Use named return values only for documentation or `defer`-based cleanup** — never naked returns in non-trivial functions.

---

### Testing

> Test naming and pyramid proportions: `testing-strategy.md`.

1. **Table-driven tests are the default pattern.**
   ```go
   func TestCalculateDiscount(t *testing.T) {
       tests := []struct{ name string; input, expected float64; wantErr bool }{
           {"zero items", 0, 0, false},
           {"negative input", -1, 0, true},
       }
       for _, tt := range tests {
           t.Run(tt.name, func(t *testing.T) {
               got, err := calculateDiscount(tt.input)
               if tt.wantErr { require.Error(t, err); return }
               require.NoError(t, err)
               assert.Equal(t, tt.expected, got)
           })
       }
   }
   ```

2. **Use `testify`** — `require` for fatal, `assert` for non-fatal.
3. **Run with race detector in CI** — `go test -race ./...`.
4. **Use `httptest.NewRecorder()` for HTTP handler tests** — no live server needed.
5. **Test behaviour, not implementation** — assert on outputs/side effects, not internal fields.

---

### Formatting and Static Analysis

All must pass with zero warnings/errors before any commit. See `code-completion-mandate.md`.

| Tool                    | Purpose                  | Command              |
| ----------------------- | ------------------------ | -------------------- |
| `gofumpt` / `goimports` | Canonical formatting     | `gofumpt -l -w .`    |
| `go vet`                | Correctness checks       | `go vet ./...`       |
| `staticcheck`           | Advanced static analysis | `staticcheck ./...`  |
| `gosec`                 | Security scanning        | `gosec -quiet ./...` |
| `golangci-lint`         | Aggregated linter (CI)   | `golangci-lint run`  |
| `govulncheck`           | Dependency CVE scanning  | `govulncheck ./...`  |

- Never disable a linter without a rationale comment.
- **`//nolint:errcheck` is NEVER acceptable.** If a function returns an error, handle it — even in `defer`. Use error-checked closures.
- Other `//nolint:` directives require `// NOLINT:` rationale AND code-review approval.
- Fast iteration: `go vet ./...` (analogous to `cargo check`) — reserve `golangci-lint` for pre-commit.

> **Logging:** Never use `fmt.Println` or `log.Printf` in production code. Use `log/slog` (stdlib, Go 1.21+). See `logging-and-observability-principles.md`.

---

### Related Principles
- Code Idioms and Conventions code-idioms-and-conventions.md
- Project Structure — Go Backend project-structure-go-backend.md
- Testing Strategy testing-strategy.md
- Error Handling Principles error-handling-principles.md
- Concurrency and Threading Principles concurrency-and-threading-principles.md
- Logging and Observability Principles logging-and-observability-principles.md
- Dependency Management Principles dependency-management-principles.md
