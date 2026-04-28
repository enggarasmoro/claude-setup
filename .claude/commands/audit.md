---
description: Review kualitas kode terstruktur - identifikasi isu tanpa menulis fitur baru. Gunakan: /audit <path-atau-fitur>
---

# Audit Workflow

Target audit: **$ARGUMENTS**

## Kapan Digunakan
- Setelah agent lain commit fitur (cross-agent review)
- Periodic quality gate pada codebase
- Sebelum release atau deployment
- Saat user ingin jaminan tanpa menulis kode baru

## Jangan Gunakan Untuk
- Menulis fitur baru → `/orchestrator`
- Memperbaiki bug yang diketahui → `/quick-fix`
- Restrukturisasi kode → `/refactor`

## Pre-Audit Checklist
Sebelum mulai, HARUS:
1. Baca `.claude/rules/rule-priority.md` — ini adalah kriteria review
2. Identifikasi scope audit (fitur spesifik, modul, atau seluruh codebase)

---

## Fase 1: Code Review

Review berdasarkan kategori berikut (urutan prioritas dari `rule-priority.md`):

### 1. Security
- Validasi input di semua boundary
- Tidak ada hardcoded secrets atau credentials
- Parameterized queries (tidak ada SQL injection)
- Pengecekan autentikasi/otorisasi yang tepat

### 2. Reliability
- Error handling di semua operasi I/O (tidak ada empty catch)
- Semua resource dibersihkan (connections, files, locks)
- Timeout di external calls
- Pola graceful degradation

### 3. Testability
- Operasi I/O di belakang interface/abstraksi
- Business logic murni (tanpa side effect)
- Dependency di-inject, bukan di-hardcode
- Test coverage di critical paths

### 4. Observability
- Semua entry point operasi dicatat (start/success/failure)
- Structured logging dengan correlation IDs
- Log level yang tepat

### 5. Code Quality
- Mengikuti pola codebase yang ada (>80% konsistensi)
- Fungsi fokus dan kecil (10-50 baris)
- Penamaan yang jelas dan mengungkap intent
- Tidak ada duplikasi kode (DRY)

---

## Fase 1.5: Cross-Boundary Review

Isu cross-boundary ada di jahitan antara komponen. Aktifkan hanya dimensi yang relevan, dan **nyatakan secara eksplisit** mana yang dilewati dan mengapa.

### Pilihan Dimensi

| Dimensi | Aktifkan Saat |
|---|---|
| **A. Integration Contracts** | Project punya frontend dan backend |
| **B. Database & Schema** | Project menggunakan database relasional/dokumen |
| **C. Configuration & Environment** | Selalu — universal |
| **D. Dependency Health** | Selalu — universal |
| **E. Test Coverage Gaps** | Selalu — universal |
| **F. Mobile ↔ Backend** | Project punya mobile app dan backend |

Di awal fase ini HARUS nyatakan:
> "Mengaktifkan dimensi: A, B, C, D, E. Melewati F (tidak ada mobile app)."

---

**Dimensi A: Integration Contracts** *(frontend + backend)*
- [ ] Map setiap endpoint backend terhadap frontend adapter — flag endpoint yang tidak dipetakan
- [ ] Verifikasi nama field, tipe, dan status code request/response cocok di kedua sisi
- [ ] Verifikasi semua outbound HTTP calls menggunakan centralized API client
- [ ] Buat auth coverage matrix: endpoint mana yang butuh auth, apakah frontend mengirim token?
- [ ] Periksa error contract: apakah frontend handle semua kode error yang bisa dikembalikan backend?

**Dimensi B: Database & Schema** *(project dengan database)*
- [ ] Verifikasi semua tabel punya kolom dasar (`id`, `created_at`, `updated_at`)
- [ ] Cek semua foreign key punya index yang sesuai
- [ ] Cross-reference nama field struct/model terhadap nama kolom DB — flag perbedaan
- [ ] Cek migrasi reversible (up + down) dan ikuti strategi additive-first
- [ ] Scan storage adapters untuk pola N+1 query

**Dimensi C: Configuration & Environment** *(selalu aktif)*
- [ ] Tidak ada hardcoded secrets, token, URL, atau credentials di source code
- [ ] `.env.template` ada dan mencakup semua env var yang direferensikan
- [ ] Startup validation gagal cepat jika config yang diperlukan hilang
- [ ] Secrets tidak pernah di-log

**Dimensi D: Dependency Health** *(selalu aktif)*
- [ ] Tidak ada top-level dependency yang tidak digunakan
- [ ] Tidak ada circular dependency antara modul fitur
- [ ] Cross-module imports hanya menggunakan public API
- [ ] Jalankan `npm audit` / `go list -m -json all | nancy` / `cargo audit` — flag CVE severity tinggi

**Dimensi E: Test Coverage Gaps** *(selalu aktif)*
- [ ] Test handler/controller ada untuk setiap API endpoint
- [ ] Integration test ada untuk setiap storage/database adapter
- [ ] Setiap error path punya setidaknya satu test
- [ ] E2E test mencakup primary user journeys

**Dimensi F: Mobile ↔ Backend** *(project dengan mobile app)*
- [ ] API version compatibility — mobile tidak memanggil endpoint yang sudah tidak ada
- [ ] Offline data sync: conflict resolution dan retry logic dites
- [ ] Auth token refresh flow bekerja ketika access token kadaluarsa

---

## Fase 2: Automated Verification

Jalankan full validation suite:
```bash
# Sesuaikan dengan stack
# Go: go vet ./... && golangci-lint run && go test ./... -cover
# TypeScript: tsc --noEmit && eslint . && vitest run --coverage
# Python: mypy . && ruff check . && pytest --cov
```

---

## Fase 3: Findings Report

**Simpan laporan ke:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

> **Zero-Findings Guard:** Jika audit menghasilkan kurang dari 3 temuan, HARUS lengkapi bagian "Dimensions Covered" sebelum menyatakan hasil bersih.

```markdown
# Code Audit: {Feature/Module Name}
Date: {date}

## Summary
- **Files reviewed:** N
- **Issues found:** N (X critical, Y major, Z minor)
- **Test coverage:** N%
- **Dimensions activated:** A, B, C, D, E (list mana yang dilewati dan alasannya)

## Critical Issues
Issues yang harus diperbaiki sebelum deployment.
- [ ] {deskripsi} — {file}:{line}

## Major Issues
Issues yang sebaiknya diperbaiki dalam waktu dekat.
- [ ] {deskripsi} — {file}:{line}

## Minor Issues
Style, naming, atau perbaikan kecil.
- [ ] {deskripsi} — {file}:{line}

## Verification Results
- Lint: PASS/FAIL
- Tests: PASS/FAIL (N passed, N failed)
- Build: PASS/FAIL
- Coverage: N%

## Dimensions Covered
| Dimensi | Status | File / Query yang Diperiksa |
|---|---|---|
| A. Integration Contracts | ✅ Checked / ⏭ Skipped (alasan) | ... |
| B. Database & Schema | ✅ Checked / ⏭ Skipped (alasan) | ... |
| C. Configuration & Environment | ✅ Checked | ... |
| D. Dependency Health | ✅ Checked | ... |
| E. Test Coverage Gaps | ✅ Checked | ... |
| F. Mobile ↔ Backend | ⏭ Skipped | Tidak ada mobile app |
```

---

## Feedback Loop

Setelah audit menghasilkan temuan:

| Tipe Temuan | Contoh | Workflow |
|---|---|---|
| **Nit/minor** (naming, formatting) | "Rename `x` ke `userCount`" | Perbaiki langsung di sini |
| **Fix kecil terisolasi** (log hilang, error handling) | "Tambah validasi input di handler" | `/quick-fix` di conversation baru |
| **Perubahan struktural** (abstraksi salah, interface hilang) | "Storage tidak di belakang interface" | `/refactor` di conversation baru |
| **Kapabilitas hilang** (endpoint baru, auth check) | "Tidak ada auth middleware di admin routes" | `/orchestrator` di conversation baru |

---

## Completion Criteria
- [ ] Semua file/fitur yang ditentukan telah direview
- [ ] Full verification suite dijalankan
- [ ] Findings document disimpan ke `docs/audits/` di repo
