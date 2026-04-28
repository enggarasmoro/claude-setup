---
description: Perbaikan bug kecil dan hotfix cepat - skip research, minimal verify
---

# Quick-Fix Workflow

## Kapan Digunakan
- Bug fix dengan root cause yang sudah diketahui
- Perubahan kecil terisolasi (< 50 baris)
- Hotfix untuk isu produksi
- Menangani temuan dari `/audit`

## Jangan Gunakan Untuk
- Fitur baru → gunakan `/orchestrator`
- Refactoring → gunakan `/refactor`
- Perubahan yang menyentuh banyak fitur atau modul

## Pre-Implementation Checklist
Sebelum mulai, HARUS:
1. Baca `.claude/rules/rule-priority.md`
2. Konfirmasi scope fix benar-benar kecil dan terisolasi

---

## Fase 1: Diagnose

1. Identifikasi bug atau isu
2. Temukan kode yang terpengaruh
3. Jika penyebab tidak jelas, gunakan `/debug` untuk analisis sistematis
4. Definisikan fix di `task.md` (maksimal 1-3 item)

---

## Fase 2: Fix + Test (TDD)

1. **Tulis failing test** yang mereproduksi bug
2. **Terapkan fix minimal** agar test lulus
3. **Verifikasi test yang ada** masih lulus

Rules yang berlaku:
- `.claude/rules/error-handling-principles.md`
- `.claude/rules/logging-and-observability-mandate.md`

---

## Fase 3: Verify + Ship

1. Jalankan full validation suite:
   ```bash
   # Go: go vet ./... && go test ./...
   # TypeScript: tsc --noEmit && vitest run
   # Python: mypy . && pytest
   ```
2. Jika semua lulus → commit dengan format:
   ```
   fix(<scope>): <deskripsi singkat>
   ```

---

## Completion Criteria
- [ ] Bug direproduksi dengan test
- [ ] Fix diterapkan dan test lulus
- [ ] Full verification suite lulus
- [ ] Di-commit dengan tipe `fix`
