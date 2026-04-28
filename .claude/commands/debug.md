---
description: Protokol debugging sistematis - validasi root cause melalui hipotesis terstruktur. Gunakan: /debug <deskripsi-masalah>
---

# Debugging Protocol

Masalah yang akan di-debug: **$ARGUMENTS**

## Overview

Skill ini menyediakan framework debugging sistematis yang bergerak melampaui troubleshooting ad-hoc ke proses terstruktur berupa generasi dan validasi hipotesis.

---

## Langkah-Langkah

### 1. Inisialisasi Sesi

Buat dokumen debugging menggunakan template dari `.claude/skills/debugging-protocol/assets/debugging-session-template.md`.

**Simpan ke:** `docs/debugging/{issue-name}-{YYYY-MM-DD}-{HHmm}.md`

Buat direktori `docs/debugging/` jika belum ada. Dokumen ini bisa direferensikan dari conversation atau workflow lain.

---

### 2. Definisikan Masalah

Tuliskan dengan jelas:
- **Symptom**: Perilaku apa yang teramati? Bagaimana berbeda dari yang diharapkan?
- **Scope**: Komponen mana yang terlibat?
- **Reproducibility**: Konsisten atau flaky?

---

### 3. Formulasikan Hipotesis

Daftarkan hipotesis yang berbeda dan bisa diuji:
- Hindari tebakan samar
- Bedakan antara layer (contoh: "Frontend Hypothesis" vs "Backend Hypothesis")
- Contoh: "Race condition di state update UI" vs "Misconfiguration schema database"

**Minimal 2-3 hipotesis sebelum mulai validasi.**

---

### 4. Desain Validation Tasks

Untuk setiap hipotesis, desain task validasi spesifik:
- **Objective**: Apa yang ingin dibuktikan atau dibantah?
- **Steps**: Tindakan tepat dan dapat direproduksi
- **Code Pattern**: Sediakan kode atau command yang tepat untuk dijalankan
- **Success Criteria**: Nyatakan secara eksplisit output apa yang mengkonfirmasi hipotesis

Contoh validasi untuk berbagai layer:
```
# Frontend — cek state
console.log('state sebelum mutasi:', JSON.stringify(state))

# Backend — trace request
curl -v -H "X-Debug: true" http://localhost:8080/api/endpoint

# Database — periksa data
SELECT * FROM table WHERE id = 'suspect-id';

# Go — tambah logging sementara
log.Printf("DEBUG nilai: %+v", nilai)
```

---

### 5. Eksekusi dan Dokumentasikan

Untuk setiap hipotesis:
1. Jalankan validation task
2. Rekam hasil aktual vs hasil yang diharapkan
3. Tandai hipotesis: ✅ Dikonfirmasi | ❌ Dibantah | ⚠️ Tidak Meyakinkan
4. Jika tidak meyakinkan — perbaiki task validasi dan coba ulang

---

### 6. Root Cause Confirmation

Sebelum menyatakan root cause:
- [ ] Apakah kamu bisa mereproduksi masalah secara konsisten?
- [ ] Apakah hipotesis dikonfirmasi oleh lebih dari satu validation task?
- [ ] Apakah memperbaiki root cause akan menyelesaikan symptom yang dilaporkan?

---

### 7. Fix dan Serahkan

Setelah root cause dikonfirmasi:
1. Update dokumen debugging dengan kesimpulan
2. Perbaiki masalah menggunakan `/quick-fix` atau `/orchestrator` sesuai cakupan
3. Tambahkan test yang mereproduksi bug (agar tidak regresi)

---

## Panduan Bahasa Spesifik

Untuk debugging patterns yang lebih detail per stack:
- Frontend → `.claude/skills/debugging-protocol/languages/frontend.md`
- Rust → `.claude/skills/debugging-protocol/languages/rust.md`

---

## Template Dokumen Debugging

```markdown
# Debugging Session: {issue-name}
**Date:** YYYY-MM-DD HH:mm
**Status:** In Progress | Resolved

## Problem Statement
**Symptom:** ...
**Expected behavior:** ...
**Actual behavior:** ...
**Reproducible:** Always / Flaky / Once

## System Context
**Components:** ...
**Environment:** dev / staging / prod
**Recent changes:** ...

## Hypotheses

### Hypothesis 1: {nama}
- **Claim:** ...
- **Validation task:** ...
- **Result:** ✅ Confirmed / ❌ Refuted / ⚠️ Inconclusive
- **Evidence:** ...

### Hypothesis 2: {nama}
...

## Root Cause
{Deskripsi root cause yang dikonfirmasi}

## Fix Applied
{Deskripsi fix yang diterapkan}

## Prevention
{Apa yang bisa dilakukan agar tidak terulang?}
```
