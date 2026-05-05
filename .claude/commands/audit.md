---
description: Structured code quality review — identify issues without writing new features. Usage: /audit <path-or-feature>
---

# Audit Workflow

Audit target: **$ARGUMENTS**

## When to Use
- Cross-agent review after a feature commit, periodic quality gates, pre-release checks.
- NOT for: new features (`/orchestrator`), bug fixes (`/quick-fix`), restructuring (`/refactor`).

## Pre-Audit
1. Read `.claude/rules/rule-priority.md` — review criteria.
2. Identify audit scope.

---

## Phase 1: Code Review (priority order)

1. **Security** — input validation, no hardcoded secrets, parameterized queries, auth checks.
2. **Reliability** — error handling on all I/O, resource cleanup, timeouts, graceful degradation.
3. **Testability** — I/O behind interfaces, pure business logic, DI, coverage on critical paths.
4. **Observability** — operation entry points logged (start/success/failure), structured logs with correlation IDs, correct levels.
5. **Code Quality** — pattern consistency >80%, focused functions (10–50 lines), clear naming, DRY.

---

## Phase 1.5: Cross-Boundary Review

Activate only applicable dimensions. **MUST state** activated/skipped at start, e.g. "Activating A, B, C, D, E. Skipping F (no mobile)."

| Dimension | Activate When |
|-----------|---------------|
| **A. Integration Contracts** | Frontend + backend |
| **B. Database & Schema** | Has database |
| **C. Configuration & Environment** | Always |
| **D. Dependency Health** | Always |
| **E. Test Coverage Gaps** | Always |
| **F. Mobile ↔ Backend** | Has mobile app |

**A. Integration Contracts:** map endpoints↔frontend adapters; verify field names/types/status codes; outbound HTTP via centralised client; auth coverage matrix; error contract alignment.

**B. Database & Schema:** base columns (`id`, `created_at`, `updated_at`); FK indexes; struct↔column drift; reversible additive migrations; N+1 patterns.

**C. Configuration & Environment:** no hardcoded secrets/URLs; `.env.template` complete; startup validation fails fast; secrets never logged.

**D. Dependency Health:** no unused deps; no circular module deps; cross-module imports use public API only; CVE scan (`npm audit`/`nancy`/`cargo audit`).

**E. Test Coverage Gaps:** handler test per endpoint; integration test per storage adapter; error path tests; E2E for primary journeys.

**F. Mobile ↔ Backend:** API version compat; offline sync conflict/retry; auth refresh mid-session.

---

## Phase 2: Automated Verification

```bash
# Go:         go vet ./... && golangci-lint run && go test ./... -cover
# TypeScript: tsc --noEmit && eslint . && vitest run --coverage
# Python:     mypy . && ruff check . && pytest --cov
```

---

## Phase 3: Findings Report

**Save to:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

> **Zero-Findings Guard:** <3 findings → MUST complete "Dimensions Covered" section before declaring clean.

```markdown
# Code Audit: {Feature}
Date: {date}

## Summary
- Files reviewed: N
- Issues: N (X critical, Y major, Z minor)
- Test coverage: N%
- Dimensions activated: A, B, C, D, E (skipped: F — reason)

## Critical Issues
- [ ] {description} — {file}:{line}

## Major Issues
- [ ] {description} — {file}:{line}

## Minor Issues
- [ ] {description} — {file}:{line}

## Verification Results
- Lint / Tests / Build / Coverage: PASS|FAIL

## Dimensions Covered
| Dimension | Status | Files Examined |
|-----------|--------|----------------|
| A | ✅/⏭ (reason) | ... |
| B | ✅/⏭ (reason) | ... |
| C | ✅ | ... |
| D | ✅ | ... |
| E | ✅ | ... |
| F | ⏭ (reason) | ... |
```

---

## Feedback Loop

| Finding | Workflow |
|---|---|
| Nit/minor (naming, formatting) | Fix inline |
| Small isolated fix (missing log/validation) | `/quick-fix` (fresh convo) |
| Structural change (wrong abstraction) | `/refactor` (fresh convo) |
| Missing capability (new endpoint/auth) | `/orchestrator` (fresh convo) |

## Completion Criteria
- [ ] All files reviewed
- [ ] Verification suite run
- [ ] Findings saved to `docs/audits/`
