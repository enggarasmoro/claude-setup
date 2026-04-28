---
description: Optimasi performa berbasis profiling - profile → analisis → prioritas → implementasi per fix
---

# Performance Optimization Workflow

**Trigger:** User memberikan data profiling, meminta optimasi performa, atau benchmark menunjukkan regresi.

Sebelum mulai, baca skill dan modul bahasa yang relevan:
- `.claude/skills/perf-optimization/SKILL.md`
- `.claude/skills/perf-optimization/languages/{bahasa}.md`

---

## Langkah-Langkah

### 1. Kumpulkan Data Profile

**Jika user memberikan file profile atau URL:**
Gunakan script ekstraksi sesuai bahasa:
```bash
# Go CPU profile
bash .claude/skills/perf-optimization/scripts/go-pprof.sh cpu profile.prof

# Go — generate + analisis sekaligus
bash .claude/skills/perf-optimization/scripts/go-pprof.sh bench ./path/to/package/... BenchmarkName

# Frontend — Lighthouse
bash .claude/skills/perf-optimization/scripts/frontend-lighthouse.sh
```

**Jika user meminta profiling dari awal:**
Jalankan script dalam mode `bench` untuk generate sekaligus analisis.

---

### 2. Analisis

Buat dokumen analisis terstruktur di `docs/research_logs/{component}-perf-analysis.md`.

Metodologi analisis:
1. Fokus pada cumulative cost, trace flat kembali ke user-land code
2. Identifikasi top 3-5 offender
3. Pisahkan benchmark artifacts dari production cost
4. Identifikasi irreducible floors (lihat tabel di language module)

---

### 3. Prioritas Fix

Buat implementation plan dengan ranking berdasarkan impact/risk:
- Low risk, high impact → kerjakan duluan
- High risk, impact apapun → kerjakan terakhir atau lewati

**Presentasikan rencana kepada user untuk persetujuan sebelum melanjutkan.**

---

### 4. Implementasi (satu fix per giliran)

Untuk setiap fix, ikuti urutan:

1. **Tulis test dulu** (TDD Red → Green)
2. **Implementasikan fix**
3. **Jalankan semua test yang ada** (`go test -race ./...` atau equivalent)
4. **Benchmark segera** — bandingkan ns/op, B/op, allocs/op
5. **Jalankan quality check** (formatter, linter, security scanner)
6. **Commit secara terpisah** dengan format conventional:
   ```
   perf(<scope>): <deskripsi>
   ```

**Aturan:** Satu fix per commit. Jangan batch optimisasi.

---

### 5. Final Verification

Setelah semua fix diterapkan:
1. Jalankan full benchmark suite dengan minimal `-count=3`
2. Bandingkan terhadap baseline asli (sebelum fix apapun)
3. Jalankan complete test suite dengan `-race`
4. Jalankan semua quality check (formatter, linter, security scanner, build)

---

### 6. Dokumentasi Hasil

Update dokumen analisis dengan:
- Tabel perbandingan benchmark before/after
- Fix mana yang diterapkan dan mana yang dilewati (beserta alasan)
- Peluang optimasi yang tersisa untuk sesi mendatang

---

### 7. Ship

Commit dan presentasikan hasil akhir kepada user dengan:
- Tabel improvement benchmark kumulatif
- Daftar commits
- Follow-up items jika ada

---

## Quick Reference

| Fase | Output | Gate |
|---|---|---|
| Profile | Raw data + extracted markdown | Data terkumpul |
| Analyze | `docs/research_logs/{component}-perf-analysis.md` | Top offenders teridentifikasi |
| Prioritize | Implementation plan | User approved |
| Implement | Tests + kode + benchmark per fix | Setiap fix lulus test |
| Verify | Full benchmark comparison | Semua check lulus |
| Ship | Conventional commits | User diberi tahu |
