---
description: Workflow lengkap 5-fase untuk membangun fitur baru - riset → implementasi → integrasi → verifikasi → commit
---

# Build Feature Workflow

**INSTRUKSI KRITIS**

KAMU DILARANG KERAS MELEWATI FASE.
Perlakukan file ini sebagai State Machine. Kamu tidak bisa transisi ke fase $N+1$ sebelum fase $N$ selesai sepenuhnya dan diverifikasi.

## Peran
Kamu adalah Senior Principal Engineer dengan mandat kepatuhan protokol yang ketat.

Sebelum memulai apapun, kamu HARUS:
1. Baca `.claude/rules/rule-priority.md`
2. Identifikasi rules yang berlaku untuk tugas ini
3. Baca file rules yang relevan (mereka adalah constraint non-negosiabel)

---

## Fase Workflow

```
Research → Implement → Integrate → [E2E?] → Verify → Ship
```

Setiap fase harus selesai sebelum lanjut. Jangan trade-off quality gate demi kecepatan.

---

### Fase 1: Research
**Rules wajib:** `.claude/rules/project-structure.md`, `.claude/rules/architectural-pattern.md`

1. Analisis permintaan — apa yang diminta, apa scope-nya?
2. Review implementasi saat ini di repository
3. Cari dokumentasi eksternal menggunakan WebSearch/WebFetch jika diperlukan
4. Buat `task.md` yang mendefinisikan scope
5. Simpan temuan di `docs/research_logs/{feature}.md`
6. Jika ada keputusan arsitektur signifikan → jalankan `/adr`

**Skills:** Gunakan `/debug` jika ada ambiguitas teknis yang perlu diselesaikan.

**Gate:** `task.md` dan research log harus ada sebelum lanjut.

---

### Fase 2: Implement
**Rules wajib:** `.claude/rules/error-handling-principles.md`, `.claude/rules/logging-and-observability-mandate.md`, `.claude/rules/testing-strategy.md`

1. Ikuti siklus TDD: **Red → Green → Refactor**
2. Buat file test terlebih dahulu (co-located dengan implementasi):
   - Go: `*_test.go`
   - TypeScript: `*.spec.ts`
3. Tulis failing test → implementasi → buat test hijau → refactor
4. Unit test dengan mocked dependencies

**Gate:** Unit test harus lulus sebelum lanjut ke Fase 3.

---

### Fase 3: Integrate
**Rules wajib:** `.claude/rules/testing-strategy.md`, `.claude/rules/resources-and-memory-management-principles.md`

WAJIB jika ANY dari berikut ini benar:
- [ ] File storage/repository dimodifikasi atau dibuat
- [ ] File external API client dimodifikasi atau dibuat
- [ ] Database query atau schema diubah
- [ ] Message queue, cache, atau I/O adapter disentuh

**BOLEH SKIP** hanya jika SEMUA kondisi di atas TIDAK terpenuhi (dan harus didokumentasikan alasannya).

1. Tulis integration test dengan infrastruktur nyata (Testcontainers jika tersedia)
2. Test adapter terhadap infrastruktur real

**Gate:** Integration test harus lulus.

---

### Fase 3.5: E2E Validation (Kondisional)
**Diperlukan jika:**
- Komponen UI ditambahkan atau dimodifikasi
- API endpoint ditambahkan/dimodifikasi yang berinteraksi dengan frontend
- Critical user-facing flows diubah

**BOLEH SKIP jika:**
- Perubahan pure backend/infrastructure
- Internal library refactoring
- Perubahan test-only

Gunakan Playwright atau tool E2E yang tersedia. Minimal satu critical user journey harus dites.

**Gate:** Setidaknya satu critical user journey dites dan lulus.

---

### Fase 4: Verify
**Rules wajib:** `.claude/rules/code-completion-mandate.md` + semua mandate yang berlaku

Jalankan full validation suite:
```bash
# Sesuaikan dengan stack yang digunakan
# Go: go vet ./... && golangci-lint run && go test ./... -cover
# TypeScript: tsc --noEmit && eslint . && vitest run --coverage
# Python: mypy . && ruff check . && pytest --cov
```

Checklist sebelum lanjut:
- [ ] Apakah file storage/database adapter dimodifikasi? → Fase 3 WAJIB
- [ ] Apakah ada perubahan UI? → Fase 3.5 WAJIB
- [ ] Lint lulus?
- [ ] Semua test lulus?
- [ ] Build berhasil?
- [ ] Coverage tidak turun?

**Gate:** SEMUA linter, test, dan build harus lulus. Jika ada yang gagal — perbaiki dulu, jangan lanjut.

---

### Fase 5: Ship (Commit)
**Rules wajib:** `.claude/rules/git-workflow-principles.md`

```bash
git status
git diff --staged
git add <file-spesifik>  # Jangan git add . sembarangan
git commit -m "feat(<scope>): <deskripsi>

<body jika perlu>"
```

Format conventional commit:
- `feat(scope): deskripsi` — fitur baru
- `fix(scope): deskripsi` — bug fix
- `refactor(scope): deskripsi` — refactoring
- `test(scope): deskripsi` — penambahan test
- `docs(scope): deskripsi` — dokumentasi

Update `task.md`: tandai semua item sebagai `[x]`.

---

## Manajemen Task.md

Status marker:
- `[ ]` = Belum dimulai
- `[/]` = Sedang dikerjakan (tandai saat **mulai**)
- `[x]` = Selesai (tandai **hanya setelah Fase 4 lulus**)

**Aturan:** Jangan pernah tandai `[x]` sebelum Fase 4 (Verify) lulus.

---

## Penanganan Error

Jika sebuah fase gagal:
1. **Dokumentasikan kegagalan** di task summary
2. **Jangan lanjut** ke fase berikutnya
3. **Perbaiki masalah** di dalam fase saat ini
4. **Jalankan ulang** kriteria completion fase tersebut
5. Baru lanjut

---

## Ringkasan Quick Reference

| Fase | Output | Blocking |
|---|---|---|
| Research | `task.md` + `docs/research_logs/*.md` | Ya |
| Implement | Unit tests + kode | Ya |
| Integrate | Integration tests | Ya (untuk adapters) |
| E2E (kondisional) | E2E tests | Ya (saat diperlukan) |
| Verify | Semua check lulus | Ya |
| Ship | Git commit | Ya |
