## Code Organization Principles

- Generate small, focused functions with clear single purposes (typically 10-50 lines)
- Keep cognitive complexity low (cyclomatic complexity < 10 for most functions)
- Maintain clear boundaries between layers (presentation, business logic, data access)
- Design for testability from the start; avoid tight coupling
- Apply consistent naming conventions that reveal intent without comments

### Module Boundaries

Feature-based organization with clear public interfaces:
- One feature = one directory
- Each module exposes a public API (exported functions/classes)
- Internal implementation details are private
- Cross-module calls only through public API

**Directory Structure (Language-Agnostic):**

> Paths illustrative — see `project-structure.md` (single source of truth). Use language-specific naming from the relevant `project-structure-*` file.

```
/task
- public_api.{ext}        # Exported interface
- business.{ext}          # Pure logic
- store.{ext}             # I/O abstraction (interface)
- postgres.{ext}          # I/O implementation
- mock.{ext}              # Test implementation
- test.{ext}              # Unit tests (mocked I/O)
- integration.test.{ext}  # Integration tests (real I/O)
```

**Go example:** `apps/backend/internal/features/task/` — `service.go`, `handler.go`, `logic.go`, `storage.go`, `storage_pg.go`, `storage_mock.go`, `logic_test.go`, `postgres_integration_test.go`

**Vue example:** `/apps/frontend/src/features/task` — `index.ts`, `task.service.ts`, `task.api.ts`, `task.api.backend.ts`, `task.store.ts`, `task.service.spec.ts`

### Feature Interaction Patterns

**Direct Import** — when a feature needs another feature's capabilities, import its Service directly:

```go
// In features/order/logic.go
import "yourapp/internal/features/task"

type Logic struct {
    taskService *task.Service  // Direct dependency injection
}
```

**Rules:**
- Only import Service (public API), never internal files like `logic.go` or `storage.go`
- Declare dependency in dependent feature's Service constructor
- Wire dependencies in `cmd/api/main.go`

```go
// cmd/api/main.go
taskService := task.NewService(taskStorage)
orderService := order.NewService(orderStorage, taskService)
```

### Avoid Circular Dependencies

A imports B, B imports A → build failures, init issues, poor module boundaries.

**Solution:** extract shared code to a third module; restructure (A→C, B→C); use dependency injection.

### Related Principles
- Core Design Principles @core-design-principles.md
- Project Structure @project-structure.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md
