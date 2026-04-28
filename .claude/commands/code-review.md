---
description: Review kode terstruktur terhadap full rule set - gunakan saat audit atau review kode dari agent lain. Gunakan: /code-review <file-atau-fitur>
---

# Code Review Skill

Target review: **$ARGUMENTS**

## Kapan Digunakan
- Selama workflow `/audit` (Fase 1: Code Review)
- Saat user meminta code review di luar workflow
- **Best practice:** Invoke di conversation baru (bukan yang sama dengan yang menulis kode) untuk menghindari confirmation bias

---

## Proses Review

### 1. Tentukan Scope

Identifikasi file/fitur yang akan direview:
- **Feature review** — semua file di direktori fitur
- **PR review** — hanya file yang berubah
- **Full codebase audit** — semua fitur

### 2. Load Rule Set

Baca rules yang berlaku dari `.claude/rules/`. Gunakan `.claude/rules/rule-priority.md` untuk klasifikasi severity.

Untuk bahasa yang direview, load anti-pattern spesifik:
- Go → `.claude/skills/code-review/languages/go.md`

### 3. Kategori Review (Urutan Prioritas)

#### Critical (Harus Diperbaiki)
- **Security** `[SEC]` — injection, hardcoded secrets, broken auth
- **Data loss** `[DATA]` — error handling hilang pada writes, tidak ada transaction boundary
- **Resource leaks** `[RES]` — koneksi tidak ditutup, cleanup hilang

#### Major (Sebaiknya Diperbaiki)
- **Testability** `[TEST]` — I/O tidak di belakang interface, error path tidak dites
- **Observability** `[OBS]` — logging hilang pada operasi, tidak ada correlation ID
- **Error handling** `[ERR]` — empty catch blocks, swallowed errors
- **Architecture** `[ARCH]` — circular dependency, akses layer yang salah

#### Minor (Bagus jika Diperbaiki)
- **Pattern consistency** `[PAT]` — penyimpangan dari pola codebase yang ada
- **Naming** — nama variabel/fungsi yang tidak jelas
- **Code organization** — fungsi terlalu panjang, tanggung jawab tercampur

#### Nit (Opsional)
- **Style** — masalah formatting yang seharusnya ditangani linter
- **Documentation** — komentar hilang pada logika kompleks

---

### 4. Hasilkan Findings

Output findings dalam format terstruktur:

```markdown
# Code Review: {Feature/Module Name}
Date: {tanggal}
Reviewer: AI Agent (fresh context)

## Summary
- **Files reviewed:** N
- **Issues found:** N (X critical, Y major, Z minor, W nit)

## Critical Issues
- [ ] **[SEC]** {deskripsi} — {file}:{line}
- [ ] **[DATA]** {deskripsi} — {file}:{line}

## Major Issues
- [ ] **[TEST]** {deskripsi} — {file}:{line}
- [ ] **[OBS]** {deskripsi} — {file}:{line}

## Minor Issues
- [ ] **[PAT]** {deskripsi} — {file}:{line}

## Nit
- [ ] {deskripsi} — {file}:{line}

## Rules Applied
Daftar rules yang direferensikan selama review ini.
```

---

### 5. Simpan Laporan

Saat dipanggil via workflow `/audit`, laporan **HARUS** disimpan ke repo:

**Path:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

1. Buat `docs/audits/` jika belum ada
2. Tulis findings ke path tersebut
3. Ini membuat laporan dapat diakses dari conversation dan agent lain

Saat dipanggil standalone (di luar `/audit`), menyimpan ke `docs/audits/` direkomendasikan tapi opsional.

---

### 6. Severity Tags

| Tag | Kategori | Sumber Rule |
|---|---|---|
| `[SEC]` | Security | `.claude/rules/security-principles.md` |
| `[DATA]` | Data integrity | `.claude/rules/error-handling-principles.md` |
| `[RES]` | Resource leak | `.claude/rules/resources-and-memory-management-principles.md` |
| `[TEST]` | Testability | `.claude/rules/architectural-pattern.md`, `.claude/rules/testing-strategy.md` |
| `[OBS]` | Observability | `.claude/rules/logging-and-observability-mandate.md` |
| `[ERR]` | Error handling | `.claude/rules/error-handling-principles.md` |
| `[ARCH]` | Architecture | `.claude/rules/architectural-pattern.md` |
| `[PAT]` | Pattern consistency | `.claude/rules/code-organization-principles.md` |
| `[INT]` | Integration contract | `.claude/rules/api-design-principles.md` |
| `[DB]` | Database design | `.claude/rules/database-design-principles.md` |
| `[CFG]` | Configuration | `.claude/rules/configuration-management-principles.md` |

---

### 7. Zero-Findings Guard

Jika review menghasilkan kurang dari 3 temuan, HARUS buat bagian "Dimensions Covered" dalam findings document yang mencantumkan setiap dimensi cross-boundary dan file atau query spesifik yang diperiksa. Baru bisa menyatakan hasil bersih.
