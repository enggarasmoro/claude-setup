# ANTIGRAVITY Project

## Aturan yang Selalu Aktif

Rules berikut berlaku di **semua** pekerjaan tanpa pengecualian. Baca dan ikuti secara ketat.

@.claude/rules/rule-priority.md
@.claude/rules/rugged-software-constitution.md
@.claude/rules/security-mandate.md
@.claude/rules/code-completion-mandate.md
@.claude/rules/logging-and-observability-mandate.md
@.claude/rules/concurrency-and-threading-mandate.md
@.claude/rules/core-design-principles.md
@.claude/rules/architectural-pattern.md
@.claude/rules/code-organization-principles.md
@.claude/rules/code-idioms-and-conventions.md
@.claude/rules/documentation-principles.md
@.claude/rules/project-structure.md

---

## Aturan Kontekstual (Baca Saat Relevan)

Rules berikut hanya diterapkan saat relevan dengan tugas:

- Error handling → `.claude/rules/error-handling-principles.md`
- Testing → `.claude/rules/testing-strategy.md`
- Security (detail) → `.claude/rules/security-principles.md`
- Database → `.claude/rules/database-design-principles.md`
- API design → `.claude/rules/api-design-principles.md`
- Git workflow → `.claude/rules/git-workflow-principles.md`
- Performance → `.claude/rules/performance-optimization-principles.md`
- Resources/memory → `.claude/rules/resources-and-memory-management-principles.md`
- Dependency management → `.claude/rules/dependency-management-principles.md`
- Configuration → `.claude/rules/configuration-management-principles.md`
- Feature flags → `.claude/rules/feature-flags-principles.md`
- CI/CD → `.claude/rules/ci-cd-principles.md`
- CI/CD + GitOps/K8s → `.claude/rules/ci-cd-gitops-kubernetes.md`
- Monitoring/alerting → `.claude/rules/monitoring-and-alerting-principles.md`
- Accessibility → `.claude/rules/accessibility-principles.md`
- Data serialization → `.claude/rules/data-serialization-and-interchange-principles.md`
- Concurrency (detail) → `.claude/rules/concurrency-and-threading-principles.md`
- Logging (detail) → `.claude/rules/logging-and-observability-principles.md`

### Idiom per Bahasa
- Go → `.claude/rules/go-idioms-and-patterns.md`
- TypeScript → `.claude/rules/typescript-idioms-and-patterns.md`
- Vue → `.claude/rules/vue-idioms-and-patterns.md`
- Python → `.claude/rules/python-idioms-and-patterns.md`
- Rust → `.claude/rules/rust-idioms-and-patterns.md`
- Flutter → `.claude/rules/flutter-idioms-and-patterns.md`

### Struktur Project per Stack
- Go backend → `.claude/rules/project-structure-go-backend.md`
- Vue frontend → `.claude/rules/project-structure-vue-frontend.md`
- Python backend → `.claude/rules/project-structure-python-backend.md`
- Flutter mobile → `.claude/rules/project-structure-flutter-mobile.md`
- Rust/Cargo → `.claude/rules/project-structure-rust-cargo.md`

---

## Perintah Tersedia (Custom Slash Commands)

| Perintah | Deskripsi |
|---|---|
| `/orchestrator` | Workflow lengkap 5-fase untuk fitur baru |
| `/quick-fix` | Perbaikan bug kecil dan hotfix cepat |
| `/refactor` | Restrukturisasi kode yang aman |
| `/audit` | Review kualitas kode terstruktur |
| `/perf-optimize` | Optimasi performa berbasis profiling |
| `/adr` | Buat Architecture Decision Record |
| `/debug` | Protokol debugging sistematis |
| `/code-review` | Review kode dengan checklist severity |
| `/sequential-thinking` | Analisis iteratif untuk masalah kompleks |
