# Code Review Skill

## Purpose
Systematically review code against the full antigravity rule set. Catches issues linters miss: architectural violations, missing observability, business logic errors, pattern inconsistencies.

## When to Invoke
- During `/audit` workflow (Phase 1: Code Review)
- User asks for code review outside any workflow
- **Best practice:** Invoke in a fresh conversation (not the one that authored the code) to avoid confirmation bias

## Review Process

### 1. Scope the Review
- **Feature review** — all files in a feature directory
- **PR review** — only changed files
- **Full codebase audit** — all features

### 2. Load the Rule Set
Read all applicable rules from `.codex/rules/`. Use `rule-priority.md` for severity classification.

### 3. Review Categories (Priority Order)

#### Critical (Must Fix)
- **Security** — injection, hardcoded secrets, broken auth
- **Data loss** — missing error handling on writes, no transaction boundaries
- **Resource leaks** — unclosed connections, missing cleanup

#### Major (Should Fix)
- **Testability** — I/O not behind interfaces, untested error paths
- **Observability** — missing logging on operations, no correlation IDs
- **Error handling** — empty catch, swallowed errors
- **Architecture** — circular dependencies, wrong layer access

#### Minor (Nice to Fix)
- **Pattern consistency** — deviation from established patterns
- **Naming** — unclear variable/function names
- **Code organization** — functions too long, mixed responsibilities

#### Nit (Optional)
- **Style** — formatting (linter would catch)
- **Documentation** — missing comments on complex logic

### 4. Produce Findings

```markdown
# Code Review: {Feature/Module Name}
Date: {date}
Reviewer: AI Agent (fresh context)

## Summary
- **Files reviewed:** N
- **Issues found:** N (X critical, Y major, Z minor, W nit)

## Critical Issues
- [ ] **[SEC]** {description} — [{file}:{line}](file:///path)
- [ ] **[DATA]** {description} — [{file}:{line}](file:///path)

## Major Issues
- [ ] **[TEST]** {description} — [{file}:{line}](file:///path)
- [ ] **[OBS]** {description} — [{file}:{line}](file:///path)

## Minor Issues
- [ ] **[PAT]** {description} — [{file}:{line}](file:///path)

## Nit
- [ ] {description} — [{file}:{line}](file:///path)

## Rules Applied
List of rules referenced during this review.
```

### 5. Save the Report

When invoked via `/audit`, you **MUST** persist findings to:
**Path:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

1. Create `docs/audits/` if missing
2. Write findings document
3. Makes report accessible from other conversations/agents

Standalone review: saving to `docs/audits/` recommended but optional.

### 6. Severity Tags

| Tag      | Category             | Rule Source                                        |
| -------- | -------------------- | -------------------------------------------------- |
| `[SEC]`  | Security             | `security-principles.md`                           |
| `[DATA]` | Data integrity       | `error-handling-principles.md`                     |
| `[RES]`  | Resource leak        | `resources-and-memory-management-principles.md`    |
| `[TEST]` | Testability          | `architectural-pattern.md`, `testing-strategy.md`  |
| `[OBS]`  | Observability        | `logging-and-observability-mandate.md`             |
| `[ERR]`  | Error handling       | `error-handling-principles.md`                     |
| `[ARCH]` | Architecture         | `architectural-pattern.md`, `project-structure.md` |
| `[PAT]`  | Pattern consistency  | `code-organization-principles.md`                  |
| `[INT]`  | Integration contract | `api-design-principles.md`                         |
| `[DB]`   | Database design      | `database-design-principles.md`                    |
| `[CFG]`  | Configuration        | `configuration-management-principles.md`           |

### 7. Language-Specific Anti-Patterns

| Language | Anti-Patterns |
|---|---|
| **Go** | `languages/go.md` |
| **TypeScript** | `languages/typescript.md` *(placeholder)* |
| **Flutter/Dart** | `languages/flutter.md` *(placeholder)* |
| **Rust** | `languages/rust.md` *(placeholder)* |

> Anti-patterns in language files are **auto-fail** — no judgment call. If pattern exists, it is a finding.

### 8. Cross-Boundary Checks

Full audits: cross-boundary concerns (integration contracts, DB schema, config hygiene, dependency health, test coverage gaps) checked via dimension checklist in `/audit` workflow — **Phase 1.5: Cross-Boundary Review**.

Standalone: apply applicable dimensions manually; tag findings `[INT]`, `[DB]`, `[CFG]`.

**Zero-Findings Guard:** If review produces fewer than 3 findings, you MUST produce a "Dimensions Covered" attestation section listing each cross-boundary dimension and the specific files/queries examined. Only then may you declare a clean result.

---

## Rule Compliance
Enforces all rules in `.codex/rules/`. Key references:
- Rule Priority rule-priority.md (severity classification)
- Security Principles security-principles.md
- Architectural Patterns architectural-pattern.md
- Testing Strategy testing-strategy.md
- Logging and Observability Mandate logging-and-observability-mandate.md
- Error Handling Principles error-handling-principles.md
