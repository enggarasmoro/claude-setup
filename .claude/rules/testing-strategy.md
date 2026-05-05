## Testing Strategy

### Test Pyramid

**Unit Tests (70%):** Test domain logic in isolation with mocked dependencies. Fast (<100ms). Single function/class/module. All external deps mocked. Coverage goal: >85% of domain logic.

**Integration Tests (20%):** Test adapters against real infrastructure. Medium (100ms-5s). Component + infra (DB, cache, queues). Real infra via Testcontainers. Coverage: all adapter implementations + critical integration points.

**End-to-End Tests (10%):** Complete user journeys through all layers. Slow (5s-30s). Full system HTTP→DB→back. Entire system running. Coverage: happy paths + critical business flows.

### Test-Driven Development (TDD)

**Red-Green-Refactor Cycle:**
1. **Red:** Write a failing test
2. **Green:** Minimal code to pass
3. **Refactor:** Clean up while green
4. **Repeat**

Benefits: testable design, comprehensive coverage, faster feedback, better interfaces.

### Test Doubles Strategy

**Unit Tests:** Mock all driven ports (repositories return canned data, external APIs return success, time/random deterministic).

**Integration Tests:** Real infrastructure — Testcontainers (PostgreSQL, Redis, queues), Firebase emulator (Auth, Firestore, RTDB, Storage, Hosting, Functions, Pub/Sub, Extensions). Test actual queries, connections, transactions.

**Best Practice:** Generate at least 2 implementations per driven port — production adapter + test adapter (in-memory/fake).

### Test Organization

**Universal Rule: Co-locate implementation tests; Separate system tests.**

**1. Unit & Integration Tests (Co-located)**
- **Rule:** Place tests next to the file they test.
- **Why:** Visible, encourages maintenance, refactor-safe.
- **Naming:**
  - **TS/JS:** `*.spec.ts` (Unit), `*.integration.spec.ts` (Integration)
  - **Go:** `*_test.go`, `*_integration_test.go`
  - **Dart/Flutter:** `*_test.dart`, `*_integration_test.dart` — tests live in `test/` mirroring `lib/` (Flutter default)
  - **Python:** `test_*.py`, `test_*_integration.py`
  - **Java:** `*Test.java` (Unit), `*IT.java` (Integration)
  - **Rust:** `#[cfg(test)] mod tests` inline in each `.rs` (Unit); `tests/` directory at crate root (Integration)

  > Strictly follow the convention for the target language. Don't mix `test`/`spec` in the same context.
  > **Language-specific overrides** (Flutter, Rust): see `project-structure-*` and `architectural-pattern.md` § Test co-location.
  > **Rust exception:** unit tests are inline `#[cfg(test)] mod tests` — official Rust convention enabling private function testing. Integration tests in `tests/` are separate crates.

**2. End-to-End Tests (Separate)**
- **Rule:** Dedicated `e2e/` folder
  - Single app: `e2e/` at project root
  - Monorepo: `apps/e2e/api/` (HTTP→DB) and `apps/e2e/ui/` (Browser→Backend→DB)
- **Naming:** `{feature}-{ui/api}.e2e.test.{ext}` — runner pattern `**/*.e2e.test.*`
  - `user-registration-api.e2e.test.ts`
  - `user-registration-ui.e2e.test.ts`

**Using Playwright MCP for UI E2E:**
```
mcp_playwright_browser_navigate(url="http://localhost:5173/login")
mcp_playwright_browser_snapshot()                              # accessibility tree (better than screenshot)
mcp_playwright_browser_type(ref="<ref>", text="test@example.com")
mcp_playwright_browser_click(ref="<ref>")
mcp_playwright_browser_wait_for(text="Welcome")
mcp_playwright_browser_snapshot(filename="login-success.md")
```

**E2E Test Requirements:**
- Capture a snapshot at each major step; save to walkthrough as proof
- For visual proof, use `browser_subagent` with `RecordingName` for video artifact
- Test happy path AND at least one error path
- Clean up test data (or use unique identifiers)

**Key Principles:**
- Unit/Integration: co-located with implementation
- E2E: separate directory (crosses boundaries)
- Test doubles: co-located with interface (`storage_mock.go`, `taskAPI.mock.ts`)
- Pattern consistency: all features follow same structure

### Test Quality Standards

**AAA Pattern (Arrange-Act-Assert):**
```ts
// Arrange
const user = { id: '123', email: 'test@example.com' };
const mockRepo = createMockRepository();
// Act
const result = await userService.createUser(user);
// Assert
expect(result.id).toBe('123');
expect(mockRepo.save).toHaveBeenCalledWith(user);
```

**Test Naming:** `should [expected behavior] when [condition]`
- `should return 404 when user not found`
- `should hash password before saving to database`
- `should reject email with invalid format`

**Coverage Requirements:**
- Unit: >85% code coverage
- Integration: all adapter implementations
- E2E: critical user journeys

### Related Principles
- Architectural Patterns — Testability-First Design @architectural-pattern.md
- Error Handling Principles @error-handling-principles.md
- Project Structure @project-structure.md
