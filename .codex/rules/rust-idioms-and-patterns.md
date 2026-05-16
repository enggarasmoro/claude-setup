## Rust Idioms and Patterns

### Core Philosophy

Rust's type system and ownership model are your primary tools for correctness. Lean into the compiler.

> **Scope:** Rust coding idioms. Layout: `project-structure-rust-cargo.md`. Test naming: `testing-strategy.md`. Logging: `logging-and-observability-principles.md`.

### Ownership and Borrowing

1. **Prefer borrowing (`&T`, `&mut T`) over cloning**
   - Never `.clone()` to silence the borrow checker without a `// CLONE:` comment
   - Use `Cow<'_, T>` when ownership is conditional
   - Prefer `&str` over `String`, `&[T]` over `Vec<T>` in parameters
2. **Minimize owned data in structs** — references with explicit lifetimes for short-lived structs; owned types when struct outlives inputs
3. **Avoid unnecessary `Arc<Mutex<T>>`** — channels (`tokio::sync::mpsc`) for one-direction flow; `RwLock` for read-heavy; `Arc<T>` (no lock) for immutable-after-init

### Error Handling

1. **Use `?` for propagation — never `unwrap()` in production code**
   - `unwrap()`/`expect()` only acceptable in: tests, infallible operations (with `// SAFETY:` comment), CLI `main()` with `expect("reason")`
2. **Choose error crates by context:**
   - Library: `thiserror` (typed enums)
   - Application: `anyhow` (ergonomic chaining)
   - Never mix: libraries must not depend on `anyhow`
3. **Error type design:**

```rust
// ✅ Typed, matchable
#[derive(Debug, thiserror::Error)]
pub enum PathfinderError {
    #[error("file not found: {path}")] FileNotFound { path: PathBuf },
    #[error(transparent)] Io(#[from] std::io::Error),
}
// ❌ Stringly-typed: fn do_thing() -> Result<(), String>

// ✅ #[must_use] forces callers to handle Result
#[must_use]
pub fn create_task(req: CreateTaskRequest) -> Result<Task, TaskError> { ... }
// `create_task(req);` warns; `let _ = create_task(req);` is intentional discard.
```

### Async and Concurrency

1. **Use `tokio` as the async runtime** — `#[tokio::main]`/`#[tokio::test]`; prefer `tokio::spawn` over `std::thread::spawn`; `tokio::select!` for racing futures
2. **Cancellation safety:** prefer `mpsc` over `broadcast` unless fan-out needed; document cancellation on async fns holding resources across `.await`; use `CancellationToken` for graceful shutdown
3. **Blocking operations:** never call blocking I/O in async; use `tokio::task::spawn_blocking` for CPU-heavy/blocking; use `tokio::fs` not `std::fs`

### Unsafe Code

1. **Zero `unsafe` blocks unless in FFI boundaries** — every `unsafe` needs a `// SAFETY:` comment explaining the invariant
2. **Minimize unsafe surface area** — encapsulate in safe wrappers; wrapper's public API must be safe; test boundary conditions
3. **Never use `unsafe` to bypass the borrow checker** — restructure instead

### Lifetimes and Generics

1. **Prefer `'_` lifetime elision** — named lifetimes only when compiler requires or when they clarify intent
2. **Keep generic bounds simple** — concrete first, generics when pattern stabilizes; `impl Trait` in argument position; `where` clauses for complex bounds
3. **Avoid lifetime gymnastics** — restructure to owned data or `Arc`; consider split borrow pattern

### Idiomatic Patterns

1. **Builder pattern** — return `Self` for chaining; `build()` returns `Result<T, BuildError>`
2. **Newtype pattern** — `struct UserId(u64)` over bare primitives; implement `Deref` only for true "is-a"
3. **Typestate pattern** — different states = different types; invalid transitions are compile errors
4. **`From`/`Into` conversions** — implement `From<A> for B` (never `Into` directly); use `#[from]` with thiserror

### Testing

1. **Test organization (Rust-specific — differs from Go/TS):**
   - **Unit tests:** `#[cfg(test)] mod tests` block **at the bottom of each `.rs` file** — official idiomatic convention. Access private functions via `use super::*`. Stripped from production builds. Do NOT create separate `*_test.rs` files.
   - **Integration tests:** `tests/` directory at crate root (each file = separate crate, public API only). No `#[cfg(test)]` needed. Shared helpers: `tests/common/mod.rs` (NOT `tests/common.rs`).
   - Use `#[tokio::test]` for async tests
2. **Test naming:** `fn test_<function>_<scenario>_<expected>()` (snake_case)
3. **Assertions:** `assert_eq!`/`assert_ne!` over `assert!(a == b)`; `assert!(matches!(result, Ok(_)))` for variant checking
4. **Property testing:** `proptest` or `quickcheck` for wide input spaces

### Clippy and Formatting

1. **`cargo check` for fast iteration**
   - `cargo check`: type-checks without binary — fastest feedback
   - `cargo clippy`: includes check + lint — use before commit
   - `cargo build`: only when artifact needed
   - Never `cargo build` during TDD cycles
2. **`cargo clippy` must pass with zero warnings before any commit** — `#[allow(clippy::...)]` only with `// ALLOW:` rationale; prefer fix over suppression
3. **`cargo fmt` is non-negotiable**
4. **Recommended Clippy config:**
   ```toml
   [lints.clippy]
   pedantic = "warn"
   unwrap_used = "deny"
   expect_used = "warn"
   ```

### Dependency Management

1. **Minimize dependency count** — each is attack surface + compile cost
2. **Pin major versions** — `dep = "1"` not `dep = "*"`
3. **Audit regularly** — `cargo audit`
4. **Prefer well-maintained crates** — check downloads, last commit, issues

### Related Principles
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Performance Optimization Principles @performance-optimization-principles.md
- Resource and Memory Management Principles @resources-and-memory-management-principles.md
- Security Mandate @security-mandate.md
- Code Idioms and Conventions @code-idioms-and-conventions.md
- Testing Strategy @testing-strategy.md
- Dependency Management Principles @dependency-management-principles.md
