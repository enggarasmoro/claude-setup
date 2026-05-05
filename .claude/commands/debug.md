---
description: Systematic debugging protocol — validate root causes through structured hypotheses. Usage: /debug <problem-description>
---

# Debugging Protocol

Problem: **$ARGUMENTS**

Structured hypothesis generation + validation. Eliminate causes before fixing.

---

## Steps

### 1. Initialise Session
Create doc from `.claude/skills/debugging-protocol/assets/debugging-session-template.md`.
**Save to:** `docs/debugging/{issue-name}-{YYYY-MM-DD}-{HHmm}.md` (create dir if missing).

### 2. Define Problem
- **Symptom** — observed vs expected
- **Scope** — components involved
- **Reproducibility** — consistent / flaky / one-off

### 3. Formulate Hypotheses
Distinct, testable hypotheses. Differentiate by layer (Frontend vs Backend). **Write ≥2–3 before validating.**

### 4. Design Validation Tasks
Per hypothesis: Objective, Steps, Code Pattern, Success Criteria.

```bash
# Frontend state
console.log('state before mutation:', JSON.stringify(state))
# Backend trace
curl -v -H "X-Debug: true" http://localhost:8080/api/endpoint
# DB inspect
SELECT * FROM table WHERE id = 'suspect-id';
# Go logging
log.Printf("DEBUG value: %+v", value)
```

### 5. Execute and Document
Per hypothesis: run task, record actual vs expected, mark ✅ Confirmed | ❌ Refuted | ⚠️ Inconclusive. Inconclusive → refine + retry.

### 6. Root Cause Confirmation
- [ ] Reproducible consistently?
- [ ] Confirmed by >1 validation?
- [ ] Fixing it resolves the symptom?

### 7. Fix and Hand Off
1. Update doc with conclusion.
2. Fix via `/quick-fix` or `/orchestrator` based on scope.
3. Add regression test.

---

## Language Guides
- Frontend → `.claude/skills/debugging-protocol/languages/frontend.md`
- Rust → `.claude/skills/debugging-protocol/languages/rust.md`

---

## Document Template

```markdown
# Debugging Session: {issue-name}
**Date:** YYYY-MM-DD HH:mm
**Status:** In Progress | Resolved

## Problem Statement
**Symptom / Expected / Actual / Reproducible:** ...

## System Context
**Components / Environment / Recent changes:** ...

## Hypotheses

### Hypothesis 1: {name}
- Claim / Validation task / Result (✅/❌/⚠️) / Evidence

### Hypothesis 2: {name}
...

## Root Cause
{description}

## Fix Applied
{description}

## Prevention
{recurrence prevention}
```
