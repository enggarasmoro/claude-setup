---
description: Restrukturisasi kode yang aman sambil mempertahankan perilaku
---

# Refactor Workflow

## Kapan Digunakan
- Restrukturisasi kode (memindahkan, rename, memisah modul)
- Migrasi pola (callbacks → async/await)
- Upgrade dependency dengan breaking changes
- Mengatasi tech debt atau perbaikan arsitektur

**Memerlukan tujuan spesifik:**
- ✅ `/refactor extract storage interface in task feature`
- ✅ `/refactor split user handler into separate auth handler`
- ❌ `/refactor apps/backend` (terlalu samar — gunakan `/audit` dulu)

## Jangan Gunakan Untuk
- Fitur baru → gunakan `/orchestrator`
- Bug fix kecil → gunakan `/quick-fix`
- "Temukan apa yang perlu diperbaiki" → gunakan `/audit` dulu

## Pre-Implementation Checklist
Sebelum mulai, HARUS:
1. Baca `.claude/rules/rule-priority.md`
2. Baca `.claude/rules/architectural-pattern.md` dan `.claude/rules/project-structure.md`

---

## Fase 1: Impact Analysis

1. **Peta blast radius** — file, modul, dan test apa yang terpengaruh?
2. **Dokumentasikan perilaku yang ada** — test apa yang saat ini lulus? kontrak apa yang ada?
3. **Identifikasi risiko** — bisa dilakukan incremental atau perlu big-bang?
4. **Buat rencana refactoring** di `task.md` dengan langkah-langkah inkremental
5. Jika ada trade-off keputusan → buat ADR dengan `/adr`

---

## Fase 2: Incremental Change (TDD)

Untuk setiap langkah dalam rencana refactoring:
1. **Pastikan test yang ada lulus** sebelum membuat perubahan apapun
2. **Buat satu perubahan inkremental** — pindahkan, rename, atau restrukturisasi
3. **Jalankan test setelah setiap perubahan** — perilaku harus dipertahankan
4. **Tambahkan test baru** jika refactoring mengekspos perilaku yang tidak dites

Rules yang berlaku:
- `.claude/rules/architectural-pattern.md`
- `.claude/rules/code-organization-principles.md`

**Prinsip kunci:** Jangan pernah merusak build lebih dari satu langkah sekaligus.

---

## Fase 3: Parity Verification

1. Jalankan full validation suite
2. **Bandingkan test coverage** — coverage harus sama atau lebih baik dari sebelumnya
3. **Verifikasi tidak ada perubahan perilaku** — input yang sama menghasilkan output yang sama
4. Jika berlaku, jalankan E2E tests

---

## Fase 4: Ship

Ikuti `.claude/rules/git-workflow-principles.md` dengan tipe commit:
```
refactor(<scope>): <deskripsi>
```

---

## Completion Criteria
- [ ] Impact analysis didokumentasikan
- [ ] Semua perubahan dilakukan incremental dengan test lulus di setiap langkah
- [ ] Full verification suite lulus
- [ ] Test coverage sama atau lebih baik dari sebelumnya
- [ ] Di-commit dengan tipe `refactor`
