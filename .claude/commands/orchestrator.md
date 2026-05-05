---
description: Full 5-phase workflow for new features — research → implement → integrate → verify → ship
---

# Build Feature Workflow

**FORBIDDEN to skip phases.** State machine: cannot transition to phase N+1 until phase N is complete and verified.

## Role
Senior Principal Engineer. Strict protocol adherence.

Before starting:
1. Read `.claude/rules/rule-priority.md`
2. Identify applicable rules
3. Read relevant rule files — non-negotiable constraints

---

## Workflow

```
Research → Implement → Integrate → [E2E?] → Verify → Ship
```

---

### Phase 1: Research
**Rules:** `project-structure.md`, `architectural-pattern.md`

1. Analyse request and scope.
2. Review codebase for patterns/dependencies.
3. WebSearch/WebFetch external docs if needed.
4. Create `task.md` with scope + acceptance criteria.
5. Save findings to `docs/research_logs/{feature}.md`.
6. Significant arch decision → run `/adr`.

**Gate:** `task.md` + research log exist.

---

### Phase 2: Implement
**Rules:** `error-handling-principles.md`, `logging-and-observability-mandate.md`, `testing-strategy.md`

1. TDD: **Red → Green → Refactor**.
2. Test file co-located: Go `*_test.go`, TS `*.spec.ts`.
3. Failing test → implement → pass → refactor.
4. Unit tests use mocked deps.

**Gate:** All unit tests pass.

---

### Phase 3: Integrate
**Rules:** `testing-strategy.md`, `resources-and-memory-management-principles.md`

REQUIRED if ANY:
- [ ] Storage/repository files modified
- [ ] External API client modified
- [ ] DB queries/schema changed
- [ ] MQ/cache/IO adapter touched

**MAY SKIP** only if all false — document reason.

1. Integration tests against real infra (Testcontainers if available).
2. Test adapters against real DB/service.

**Gate:** Integration tests pass.

---

### Phase 3.5: E2E (Conditional)

**Required:** UI changes, new/modified user-facing API endpoints, critical flows changed.
**May skip:** pure backend/infra, internal refactor, test-only changes.

Use Playwright or available E2E tool.

**Gate:** ≥1 critical user journey passes.

---

### Phase 4: Verify
**Rules:** `code-completion-mandate.md` + applicable mandates

```bash
# Go:         go vet ./... && golangci-lint run && go test ./... -cover
# TypeScript: tsc --noEmit && eslint . && vitest run --coverage
# Python:     mypy . && ruff check . && pytest --cov
```

Checklist:
- [ ] Storage changes → Phase 3 done?
- [ ] UI changes → Phase 3.5 done?
- [ ] Lint/tests/build pass?
- [ ] Coverage not dropped?

**Gate:** All linters/tests/builds pass. Fix failures, do not proceed.

---

### Phase 5: Ship
**Rules:** `git-workflow-principles.md`

```bash
git status
git diff --staged
git add <specific-files>   # never blindly git add .
git commit -m "feat(<scope>): <description>"
```

Commit types: `feat | fix | refactor | test | docs (scope): desc`.

Update `task.md`: mark all `[x]`.

---

## task.md Markers
- `[ ]` not started
- `[/]` in progress (set when **starting**)
- `[x]` complete (**only after Phase 4 passes**)

## Error Handling
Phase fails → document failure, do not proceed, fix in current phase, re-run criteria, then proceed.

## Quick Reference

| Phase | Output | Blocking |
|-------|--------|----------|
| Research | `task.md` + research log | Yes |
| Implement | Unit tests + code | Yes |
| Integrate | Integration tests | Yes (adapters) |
| E2E | E2E tests | When required |
| Verify | All checks pass | Yes |
| Ship | Git commit | Yes |
