---
description: Profile-driven performance optimization — profile → analyse → prioritise → implement one fix at a time
---

# Performance Optimization Workflow

**Trigger:** profiling data provided, optimization requested, or benchmark regression.

Before starting, read:
- `.claude/skills/perf-optimization/SKILL.md`
- `.claude/skills/perf-optimization/languages/{language}.md`

---

## Steps

### 1. Collect Profile Data

```bash
# Go CPU profile
bash .claude/skills/perf-optimization/scripts/go-pprof.sh cpu profile.prof
# Go bench (generate + analyse)
bash .claude/skills/perf-optimization/scripts/go-pprof.sh bench ./path/... BenchmarkName
# Frontend
bash .claude/skills/perf-optimization/scripts/frontend-lighthouse.sh
```

If profiling from scratch: use `bench` mode.

### 2. Analyse
Create `docs/research_logs/{component}-perf-analysis.md`.
- Focus cumulative cost; trace flat → user-land code.
- Identify top 3–5 offenders.
- Separate benchmark artifacts from real cost.
- Identify irreducible floors (language module table).

### 3. Prioritise Fixes
Implementation plan ranked by impact/risk: low-risk-high-impact first; high-risk last/skip.
**Present plan to user. Wait for approval before coding.**

### 4. Implement (one fix at a time)
Per fix:
1. Test first (TDD Red → Green).
2. Implement.
3. Run all tests (`go test -race ./...` or equiv).
4. Benchmark — compare ns/op, B/op, allocs/op.
5. Quality checks (formatter, linter, security).
6. Commit: `perf(<scope>): <description>`.

**Rule:** one fix per commit. Never batch.

### 5. Final Verification
- Full bench suite `-count=3` minimum, vs original baseline.
- Full test suite with `-race`.
- All quality checks.

### 6. Document
Update analysis doc: before/after table, applied vs skipped (with reasons), remaining opportunities.

### 7. Ship
Commit + present results: cumulative improvement table, commit list, follow-ups.

---

## Quick Reference

| Phase | Output | Gate |
|-------|--------|------|
| Profile | Raw data + markdown | Data collected |
| Analyse | Analysis doc | Top offenders identified |
| Prioritise | Plan | User approved |
| Implement | Test + code + bench per fix | Tests pass |
| Verify | Full bench comparison | All checks pass |
| Ship | Conventional commits | User notified |
