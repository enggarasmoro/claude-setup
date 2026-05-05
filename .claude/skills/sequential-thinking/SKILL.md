# Sequential Thinking

Structured approach to complex problem-solving — iterative thought steps with built-in flexibility for revision and course correction.

## When to Use This Skill

- Breaking down complex problems into manageable steps
- Planning/design requiring iterative refinement
- Analysis that might need course correction mid-stream
- Problems where full scope emerges during analysis
- Multi-step solutions requiring context across steps
- Filtering out irrelevant information
- Hypothesis generation and verification workflows

## Core Methodology

1. **Initial estimation:** Estimate thoughts needed, but stay flexible
2. **Iterative analysis:** Work through thoughts sequentially, building context
3. **Revision capability:** Question/revise previous thoughts as understanding deepens
4. **Branch exploration:** Explore alternatives when needed
5. **Hypothesis cycle:** Generate, verify against thought chain, repeat
6. **Convergence:** Continue until satisfactory solution

## Instructions

### Thought Structure

Each thought includes:
- **thought**: Current thinking step content
- **thoughtNumber**: Position in sequence (1, 2, 3, ...)
- **totalThoughts**: Current estimate (adjustable)
- **nextThoughtNeeded**: Whether another step is required

Optional revision/branching metadata:
- **isRevision**: Boolean — reconsidering previous thinking
- **revisesThought**: Which thought number is being revised
- **branchFromThought**: Branching point thought number
- **branchId**: Identifier for current branch
- **needsMoreThoughts**: Reaching end but requires more analysis

### Process Guidelines

**Starting out:** Estimate initial thoughts by complexity; begin with thought 1 establishing context/approach; set totalThoughts conservatively (adjustable).

**During analysis:** Build on previous thoughts; filter irrelevant info; express uncertainty; revise on errors/better approaches; adjust totalThoughts as scope clarifies.

**Revision pattern:**
```json
{
  "thought": "On reflection, thought 3's assumption about X was incorrect because Y...",
  "thoughtNumber": 6,
  "totalThoughts": 10,
  "isRevision": True,
  "revisesThought": 3,
  "nextThoughtNeeded": True
}
```

**Hypothesis cycle:**
1. Generate hypothesis from current understanding
2. Verify against previous thought chain
3. If verification fails, revise or branch
4. Repeat until validated

**Completion:** Set `nextThoughtNeeded: False` only when truly satisfied; provide single clear final answer; ensure it directly addresses the original problem.

### Working with Context

- **Maintain continuity:** reference previous thoughts by number; build logical connections; track valid vs revised
- **Filter information:** ignore irrelevant details; focus on what advances understanding; re-evaluate relevance as context evolves
- **Manage complexity:** break overly complex thoughts into multiple; increase totalThoughts accordingly; keep each thought focused

### Output Format

```
Thought [N/Total]: [Current thought content]
[If revision: "This revises thought X because..."]
[If branching: "Branching from thought X to explore..."]

[Continue with next thought when nextThoughtNeeded is True]

Final output after all thoughts complete:
Solution: [Clear, direct answer to the original problem]
```

## Examples

See `resources/examples.md` for concrete examples.

## Key Principles

- **Flexibility over rigidity:** adjust as understanding deepens
- **Revision is strength:** correcting course shows good reasoning
- **Hypothesis-driven:** generate and test iteratively
- **Context-aware:** maintain awareness of previous thoughts while progressing
- **Clarity at completion:** deliver a single, clear final answer
