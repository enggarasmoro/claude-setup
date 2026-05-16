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
- Error handling: `.codex/rules/error-handling-principles.md`
- Testing strategy: `.codex/rules/testing-strategy.md`
- Security (detailed/OWASP): `.codex/rules/security-principles.md`
- Database design: `.codex/rules/database-design-principles.md`
- API design (REST, errors, pagination): `.codex/rules/api-design-principles.md`
- Git workflow / commits: `.codex/rules/git-workflow-principles.md`
- Performance optimization: `.codex/rules/performance-optimization-principles.md`
- Resources / memory: `.codex/rules/resources-and-memory-management-principles.md`
- Dependency management: `.codex/rules/dependency-management-principles.md`
- Configuration: `.codex/rules/configuration-management-principles.md`
- Feature flags (PRD-gated only): `.codex/rules/feature-flags-principles.md`
- CI/CD pipelines: `.codex/rules/ci-cd-principles.md`
- CI/CD + K8s/GitOps: `.codex/rules/ci-cd-gitops-kubernetes.md`
- Monitoring/alerting: `.codex/rules/monitoring-and-alerting-principles.md`
- Accessibility (WCAG 2.1 AA): `.codex/rules/accessibility-principles.md`
- Data serialization: `.codex/rules/data-serialization-and-interchange-principles.md`
- Concurrency (detail): `.codex/rules/concurrency-and-threading-principles.md`
- Logging (detail/per-language): `.codex/rules/logging-and-observability-principles.md`
- Architectural patterns (testability-first): `.codex/rules/architectural-pattern.md`
- Code organization / modules: `.codex/rules/code-organization-principles.md`
- Documentation: `.codex/rules/documentation-principles.md`
- Rule priority (conflict tiebreaker): `.codex/rules/rule-priority.md`
- Rugged software constitution: `.codex/rules/rugged-software-constitution.md`
- Command execution safety: `.codex/rules/command-execution-principles.md`

### Language idioms (load only the language in use)
- Go: `.codex/rules/go-idioms-and-patterns.md`
- TypeScript: `.codex/rules/typescript-idioms-and-patterns.md`
- Vue 3: `.codex/rules/vue-idioms-and-patterns.md`
- Python: `.codex/rules/python-idioms-and-patterns.md`
- Rust: `.codex/rules/rust-idioms-and-patterns.md`
- Flutter/Dart: `.codex/rules/flutter-idioms-and-patterns.md`
- PHP (native — backend): `.codex/rules/php-idioms-and-patterns.md`
- PHP (native — frontend: Twig/HTMX/Alpine/Vite): `.codex/rules/php-frontend-idioms-and-patterns.md`
- Laravel (backend): `.codex/rules/laravel-idioms-and-patterns.md` (load alongside PHP)
- Laravel (frontend — Blade/Livewire/Inertia/Filament): `.codex/rules/laravel-frontend-idioms-and-patterns.md`

### Project structure per stack (load only the stack in use)
- Universal: `.codex/rules/project-structure.md`
- Go backend: `.codex/rules/project-structure-go-backend.md`
- Vue/React frontend: `.codex/rules/project-structure-vue-frontend.md`
- Python backend: `.codex/rules/project-structure-python-backend.md`
- Flutter mobile: `.codex/rules/project-structure-flutter-mobile.md`
- Rust/Cargo: `.codex/rules/project-structure-rust-cargo.md`
- PHP backend (native/micro-framework): `.codex/rules/project-structure-php-backend.md`
- Laravel backend: `.codex/rules/project-structure-laravel-backend.md`

---

## Workflows

Universal engineering workflows available as global slash commands (source: `~/.codex/prompts/`):

| Slash | Use |
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

Workflows are not project-specific. Rules (`.codex/rules/`) and skills (`.codex/skills/`) are project-specific.

## Skills (load on demand)

Not slash commands — load the `SKILL.md` at the given path when the task is relevant:

- **ADR** — `.codex/skills/adr/SKILL.md` (architecture decision documentation)
- **Code Review** — `.codex/skills/code-review/SKILL.md` (PR / diff review)
- **Debugging Protocol** — `.codex/skills/debugging-protocol/SKILL.md` (hypothesis-driven debugging; per-language submodules in `languages/`)
- **Frontend Design** — `.codex/skills/frontend-design/SKILL.md` (UI/UX, a11y, visual audit)
- **Guardrails** — `.codex/skills/guardrails/SKILL.md` (anti-drift, scope enforcement)
- **Mobile Design** — `.codex/skills/mobile-design/SKILL.md` (Flutter/RN UX)
- **Perf Optimization** — `.codex/skills/perf-optimization/SKILL.md` (profile → analyse → fix)
- **Sequential Thinking** — `.codex/skills/sequential-thinking/SKILL.md` (iterative reasoning)
