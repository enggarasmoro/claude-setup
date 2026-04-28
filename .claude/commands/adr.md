---
description: Buat Architecture Decision Record untuk mendokumentasikan keputusan arsitektur signifikan. Gunakan: /adr <judul-singkat>
---

# Architecture Decision Record (ADR)

Membuat ADR untuk: **$ARGUMENTS**

## Kapan Membuat ADR
- Saat memilih antara 2+ pendekatan yang layak
- Saat memperkenalkan dependency atau pola baru
- Saat mengubah arsitektur yang ada
- Saat ada trade-off signifikan yang perlu didokumentasikan

## Penyimpanan ADR

ADR disimpan di `docs/decisions/` sebagai file bernomor:
```
docs/decisions/
├── 0001-use-postgresql-for-storage.md
├── 0002-adopt-feature-based-structure.md
└── NNNN-short-title.md
```

Langkah-langkah:
1. Cek file ADR terakhir di `docs/decisions/` untuk menentukan nomor berikutnya
2. Buat file baru: `docs/decisions/NNNN-{judul-dari-argumen}.md`
3. Isi dengan template di bawah

---

## Template ADR

```markdown
# NNNN. {Judul Singkat}

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by NNNN

## Context
Apa masalah yang memotivasi keputusan ini?
Sertakan constraint teknis, kebutuhan bisnis, dan konteks relevan.

## Options Considered

### Option A: {nama}
- **Pros:** ...
- **Cons:** ...
- **Effort:** Low/Medium/High

### Option B: {nama}
- **Pros:** ...
- **Cons:** ...
- **Effort:** Low/Medium/High

### Option C: {nama} (jika ada)
- **Pros:** ...
- **Cons:** ...
- **Effort:** Low/Medium/High

## Decision
Kami memilih **Option X** karena...

## Consequences

### Positive
- Apa yang menjadi lebih mudah atau memungkinkan sebagai hasilnya

### Negative
- Apa yang menjadi lebih sulit
- Technical debt yang diperkenalkan (jika ada)

### Risks
- Risiko yang teridentifikasi
```

---

## Setelah ADR Dibuat

1. Verifikasi file disimpan dengan benar di `docs/decisions/`
2. Konfirmasi kepada user bahwa ADR telah dibuat dan tautkan ke file
3. Jika dalam workflow `/orchestrator` atau `/refactor`, lanjutkan ke fase berikutnya
