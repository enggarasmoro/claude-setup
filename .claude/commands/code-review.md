---
description: Structured code review against the full rule set. Usage: /code-review <file-or-feature>
---

# Code Review

Target: **$ARGUMENTS**

## When to Use
- During `/audit` Phase 1, or standalone review.
- **Best practice:** fresh conversation (avoid confirmation bias).

---

## Process

### 1. Define Scope
Feature review (all files in dir) | PR review (changed files) | Full audit.

### 2. Load Rule Set
Read `.claude/rules/` rules. Use `rule-priority.md` for severity. Language anti-patterns: e.g. `.claude/skills/code-review/languages/go.md`.

### 3. Review Categories (priority order)

**Critical (Must Fix)**
- `[SEC]` Security — injection, hardcoded secrets, broken auth
- `[DATA]` Data loss — missing error handling on writes, no tx boundaries
- `[RES]` Resource leaks — unclosed connections, missing cleanup

**Major (Should Fix)**
- `[TEST]` Testability — I/O not behind interfaces, untested error paths
- `[OBS]` Observability — missing logging, no correlation IDs
- `[ERR]` Error handling — empty catch, swallowed errors
- `[ARCH]` Architecture — circular deps, wrong-layer access

**Minor (Nice to Fix)**
- `[PAT]` Pattern consistency — deviation from codebase
- Naming — unclear names
- Code organisation — long functions, mixed responsibilities

**Nit (Optional)**
- Style (linter would catch), missing comments on complex logic

---

### 4. Findings Format

```markdown
# Code Review: {Feature}
Date: {date}
Reviewer: AI Agent (fresh context)

## Summary
- Files reviewed: N
- Issues: N (X critical, Y major, Z minor, W nit)

## Critical Issues
- [ ] **[SEC]** {description} — {file}:{line}

## Major Issues
- [ ] **[TEST]** {description} — {file}:{line}

## Minor Issues
- [ ] **[PAT]** {description} — {file}:{line}

## Nit
- [ ] {description} — {file}:{line}

## Rules Applied
{list}
```

### 5. Save Report
Via `/audit`: **MUST** save to `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`.
Standalone: recommended.

### 6. Severity Tag → Rule

| Tag | Rule source |
|-----|-------------|
| `[SEC]` | `security-principles.md` |
| `[DATA]` | `error-handling-principles.md` |
| `[RES]` | `resources-and-memory-management-principles.md` |
| `[TEST]` | `architectural-pattern.md`, `testing-strategy.md` |
| `[OBS]` | `logging-and-observability-mandate.md` |
| `[ERR]` | `error-handling-principles.md` |
| `[ARCH]` | `architectural-pattern.md` |
| `[PAT]` | `code-organization-principles.md` |
| `[INT]` | `api-design-principles.md` |
| `[DB]` | `database-design-principles.md` |
| `[CFG]` | `configuration-management-principles.md` |

### 7. Zero-Findings Guard
<3 findings → MUST produce "Dimensions Covered" attestation listing each cross-boundary dimension and files/queries examined before declaring clean.
