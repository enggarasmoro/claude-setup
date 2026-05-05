# ANTIGRAVITY Project

## Always-On Core (mandatory, never skip)

**Security first.** Never trust user input. Validate server-side. Deny by default. Fail closed. Never log secrets/PII/tokens. Never concatenate SQL — use parameterized queries. Hash passwords with Argon2id/Bcrypt(12+).

**Defensive code.** Assume inputs are malicious. Validate at every boundary. No silent failures — all errors handled explicitly. No empty catch. Clean up resources in all paths (defer/finally/RAII). Timeout all I/O.

**Observability mandatory.** Every operation entry point (API, job, handler, CLI) logs start, success, failure with structured key-value: `correlationId`, `operation`, `duration`, `userId`, `error`. Use the language's structured logger (slog/pino/structlog). Never `fmt.Println`/`console.log`/`print` in service code.

**Code completion gate.** Before marking a task done: run language formatter + linter + type-checker + security scan. Fix all issues. Never disable a lint with `//nolint`/`# noqa`/`eslint-disable` without a comment explaining why. `errcheck` suppression is never acceptable.

**Design.** SOLID + KISS + YAGNI. Small focused functions (10-50 lines). Cyclomatic <10. I/O behind interfaces. Pure business logic. Dependencies inject inward. Tests must run without DB/network.

**Idiomatic.** Write idiomatic code for the target language. Don't write Java in Python or C in Go. Use the project's existing patterns (>80% consistency required — if not, stop and report fragmentation).

**Project layout.** Organize by FEATURE (vertical slice), not technical layer. One feature = one directory with its own handler/service/logic/storage/tests co-located.

**Conflict resolution priority:** Security > Rugged defensibility > Code completion + Logging > Testability > Feature-specific idioms > YAGNI/KISS.

---

## Lazy-Load Reference (read only when task touches the area)

Read the file at the path when the topic is relevant to the current task. Do NOT load preemptively.

### Cross-cutting principles
- Error handling: `.claude/rules/error-handling-principles.md`
- Testing strategy: `.claude/rules/testing-strategy.md`
- Security (detailed/OWASP): `.claude/rules/security-principles.md`
- Database design: `.claude/rules/database-design-principles.md`
- API design (REST, errors, pagination): `.claude/rules/api-design-principles.md`
- Git workflow / commits: `.claude/rules/git-workflow-principles.md`
- Performance optimization: `.claude/rules/performance-optimization-principles.md`
- Resources / memory: `.claude/rules/resources-and-memory-management-principles.md`
- Dependency management: `.claude/rules/dependency-management-principles.md`
- Configuration: `.claude/rules/configuration-management-principles.md`
- Feature flags (PRD-gated only): `.claude/rules/feature-flags-principles.md`
- CI/CD pipelines: `.claude/rules/ci-cd-principles.md`
- CI/CD + K8s/GitOps: `.claude/rules/ci-cd-gitops-kubernetes.md`
- Monitoring/alerting: `.claude/rules/monitoring-and-alerting-principles.md`
- Accessibility (WCAG 2.1 AA): `.claude/rules/accessibility-principles.md`
- Data serialization: `.claude/rules/data-serialization-and-interchange-principles.md`
- Concurrency (detail): `.claude/rules/concurrency-and-threading-principles.md`
- Logging (detail/per-language): `.claude/rules/logging-and-observability-principles.md`
- Architectural patterns (testability-first): `.claude/rules/architectural-pattern.md`
- Code organization / modules: `.claude/rules/code-organization-principles.md`
- Documentation: `.claude/rules/documentation-principles.md`
- Rule priority (conflict tiebreaker): `.claude/rules/rule-priority.md`
- Rugged software constitution: `.claude/rules/rugged-software-constitution.md`
- Command execution safety: `.claude/rules/command-execution-principles.md`

### Language idioms (load only the language in use)
- Go: `.claude/rules/go-idioms-and-patterns.md`
- TypeScript: `.claude/rules/typescript-idioms-and-patterns.md`
- Vue 3: `.claude/rules/vue-idioms-and-patterns.md`
- Python: `.claude/rules/python-idioms-and-patterns.md`
- Rust: `.claude/rules/rust-idioms-and-patterns.md`
- Flutter/Dart: `.claude/rules/flutter-idioms-and-patterns.md`

### Project structure per stack (load only the stack in use)
- Universal: `.claude/rules/project-structure.md`
- Go backend: `.claude/rules/project-structure-go-backend.md`
- Vue/React frontend: `.claude/rules/project-structure-vue-frontend.md`
- Python backend: `.claude/rules/project-structure-python-backend.md`
- Flutter mobile: `.claude/rules/project-structure-flutter-mobile.md`
- Rust/Cargo: `.claude/rules/project-structure-rust-cargo.md`

---

## Commands

| Command | Use |
|---|---|
| `/orchestrator` | New feature (5-phase: research→implement→integrate→verify→ship) |
| `/quick-fix` | Bugfix / hotfix |
| `/refactor` | Behavior-preserving restructure (needs scoped goal) |
| `/audit` | Quality review without writing features |
| `/code-review` | Severity-checklisted review |
| `/perf-optimize` | Profile-driven optimization |
| `/debug` | Hypothesis-driven debugging |
| `/adr` | Architecture Decision Record |
| `/sequential-thinking` | Iterative analysis for complex problems |
