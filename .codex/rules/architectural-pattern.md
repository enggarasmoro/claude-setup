## Architectural Patterns — Testability-First Design

### Core Principle
All code must be independently testable without running the full application or external infrastructure.

### Universal Architecture Rules

#### Rule 1: I/O Isolation

Abstract all I/O behind interfaces/contracts: database queries, HTTP calls, file system, time/randomness, message queues.

**Implementation:**
1. Search the codebase for existing abstraction patterns (symbols: `Interface`, `Mock`, `Repository`, `Store`, `Adapter`) using your codebase search tool
2. Match the style (interface in Go, Protocol in Python, interface in TypeScript)
3. Implement production adapter AND test adapter

**Example (Go):**
```go
type UserStore interface {
    Create(ctx context.Context, user User) error
    GetByEmail(ctx context.Context, email string) (*User, error)
}
type PostgresUserStore struct { /* ... */ }  // production
type MockUserStore struct { /* ... */ }      // test
```

#### Rule 2: Pure Business Logic

Extract calculations, validations, transformations into pure functions: input → output, no side effects, deterministic, no I/O inside business rules.

```go
// ❌ Impure — DB call inside
func calculateDiscount(ctx context.Context, items []Item, coupon Coupon) (float64, error) {
    validCoupon, err := db.GetCoupon(ctx, coupon.ID) // NO!
}

// ✅ Correct: fetch first, then call pure logic, then persist
validCoupon, err := store.GetCoupon(ctx, coupon.ID)
discount, err := calculateDiscount(items, validCoupon)
err = store.SaveOrder(ctx, order)
```

#### Rule 3: Dependency Direction

Dependencies point inward toward business logic:

```
Infrastructure (DB, HTTP, Files) ──depends on──▶ Contracts/Interfaces ──depends on──▶ Business Logic (pure)
```

**Never:** business logic imports DB driver; domain entities import HTTP framework; core calculations import config files.
**Always:** infrastructure implements interfaces defined by business layer; business logic receives dependencies via injection.

### Pattern Discovery Protocol

**Before implementing ANY feature:**

1. **Search existing patterns** (MANDATORY) — symbols: `Interface`, `Repository`, `Service`, `Store`, `Mock`
2. **Examine 3 existing modules** for consistency (DB access, pure vs I/O, testing patterns)
3. **Document pattern** (>80% consistency required): "Following pattern from [task, user, auth]"; "X/Y modules use interface-based stores"
4. **If consistency <80%:** STOP and report fragmentation to human

### Testability Compliance

Architectural requirements that the code structure must satisfy. A design that cannot meet them is non-compliant.

**Unit testability (non-negotiable):**
- Unit tests MUST run without starting any database, external service, or network call
- All I/O dependencies MUST be abstractable to the point where a mock can replace them
- Business logic MUST be exercisable in isolation from infrastructure (enforced by Rules 1 & 2)

**Integration testability:**
- Every I/O adapter MUST be independently testable against real infrastructure
- Adapters must be replaceable — application must not hard-wire a specific implementation

**Test co-location (structural rule):**
- Default: unit/integration tests co-locate with the implementation they test
- E2E tests: dedicated directory — `e2e/` at root for single-app, `apps/e2e/` for monorepos. See `testing-strategy.md`.
- **Language overrides:** Flutter uses mirrored `test/`; Rust uses inline `#[cfg(test)]`. Language-specific `project-structure-*` files take precedence.

> See `testing-strategy.md` for pyramid proportions, naming, tools.

### Language-Specific Idioms

See dedicated idiom files in `code-idioms-and-conventions.md` for per-ecosystem authoritative guidance.

**Universal rule:** I/O behind an interface, business logic pure, tests inject mock/fake.

### Enforcement Checklist

- [ ] Can I run unit tests without starting database/external services?
- [ ] Are all I/O operations behind an abstraction?
- [ ] Is business logic pure (no side effects)?
- [ ] Do integration tests exist for all adapters?
- [ ] Does pattern match existing codebase (>80% consistency)?

### Related Principles
- Core Design Principles @core-design-principles.md
- Testing Strategy @testing-strategy.md
- Code Organization Principles @code-organization-principles.md
- Project Structure @project-structure.md
- Database Design Principles @database-design-principles.md
