---
description: Iterative analysis for complex problems — step-by-step reasoning with revision and branching. Usage: /sequential-thinking <problem>
---

# Sequential Thinking

Problem: **$ARGUMENTS**

## When to Use
Complex breakdown, iterative design, mid-stream course correction, emerging scope, multi-step solutions, hypothesis generation/verification.

---

## Methodology

1. **Initial estimate** of thought count (stay flexible).
2. **Iterative analysis** — sequential thoughts, building context.
3. **Revision** — question/revise prior thoughts as understanding deepens.
4. **Branch exploration** for alternatives.
5. **Hypothesis cycle** — generate, verify against chain, repeat.
6. **Convergence** — until satisfactory solution.

---

## Instructions

### Starting
- Estimate thoughts from complexity. Set `totalThoughts` conservatively; adjust later.
- Thought 1 establishes context + approach.

### During
- Build on prior thoughts; filter irrelevant info; express uncertainty; revise on errors.

### Revision Pattern
```
Thought [N/Total]: On reflection, thought 3's assumption about X was incorrect because Y...
[Revises thought 3]
```

### Branching Pattern
```
Thought [N/Total]: Branching from thought X to explore an alternative approach...
[branchFromThought: X]
```

### Hypothesis Cycle
Generate → verify against chain → if fails, revise/branch → repeat until validated.

### Completion
Conclude only when satisfied. Single, clear final answer addressing the original problem.

---

## Output Format

```
Thought [N/Total]: {step}
[If revision: "Revises thought X because..."]
[If branching: "Branching from thought X to explore..."]

[Continue]

Solution: {clear answer}
```

---

## Key Principles
- Flexibility over rigidity
- Revision is strength
- Hypothesis-driven
- Context-aware
- Clarity at completion

Examples: `.claude/skills/sequential-thinking/resources/examples.md`.
