# ANTIGRAVITY — Claude Code Configuration

Konfigurasi lengkap untuk Claude Code yang mengadaptasi standar engineering. Mencakup aturan coding, workflow pengembangan, dan skill yang bisa dipanggil via slash command.

---

## Prasyarat

- **Claude Code** versi terbaru sudah terinstall
- Untuk cek versi: `claude --version`
- Untuk install/update: `npm install -g @anthropic-ai/claude-code`

---

## Cara Kerja Sistem Ini

Sistem ini terdiri dari 3 lapisan:

```
CLAUDE.md           → Dimuat otomatis setiap kali Claude Code dibuka di project
.claude/rules/      → 42 file aturan coding (selalu aktif & kontekstual)
.claude/commands/   → 9 slash command yang bisa dipanggil kapan saja
.claude/skills/     → Aset pendukung (template, script, panduan bahasa)
```

### Bagaimana CLAUDE.md Bekerja

Claude Code otomatis membaca `CLAUDE.md` setiap kali sesi baru dimulai di direktori tersebut. File ini menggunakan sintaks `@path/to/file` untuk mengimpor konten file lain — sehingga 12 aturan inti (`always-on rules`) langsung masuk ke konteks Claude tanpa perlu dipanggil manual.

### Bagaimana Rules Bekerja

| Tipe | Lokasi | Kapan Aktif |
|------|--------|-------------|
| **Always-On** (12 rules) | Di-import via `CLAUDE.md` | Setiap saat, tanpa perlu dipanggil |
| **Contextual** (30 rules) | `.claude/rules/` | Direferensikan oleh command saat relevan |

### Bagaimana Commands Bekerja

File `.md` di `.claude/commands/` menjadi slash command. Ketik `/nama-command` di Claude Code untuk memanggilnya. Claude akan membaca isi file tersebut sebagai instruksi.

---

## Opsi 1: Penggunaan Per-Project (Direkomendasikan)

Pendekatan ini membuat konfigurasi terisolasi per project — ideal jika setiap project punya standar yang berbeda, atau kamu ingin mencoba dulu sebelum pakai global.

### Langkah Setup

**1. Salin konfigurasi ke project kamu**

```bash
# Dari direktori project kamu
cp -r /path/ke/ANTIGRAVITY/CLAUDE.md ./CLAUDE.md
cp -r /path/ke/ANTIGRAVITY/.claude ./.claude
```

Atau jika kamu clone repo ini:

```bash
git clone <repo-url> ANTIGRAVITY
cd my-project
cp -r ../ANTIGRAVITY/CLAUDE.md .
cp -r ../ANTIGRAVITY/.claude .
```

**2. Sesuaikan CLAUDE.md dengan project kamu**

Buka `CLAUDE.md` dan ganti bagian header:

```markdown
# ANTIGRAVITY Project          ← ganti dengan nama project kamu
```

Jika project kamu tidak pakai semua stack, kamu bisa hapus bagian yang tidak relevan di "Aturan Kontekstual". Misalnya, jika project kamu pure Go, hapus bagian idiom Vue, Flutter, Rust.

**3. Buka Claude Code di direktori project**

```bash
cd my-project
claude
```

Claude Code akan otomatis membaca `CLAUDE.md` dan semua rule yang di-import.

### Verifikasi Setup Per-Project

Ketik ini di Claude Code:

```
Apa saja rules yang aktif saat ini?
```

Claude harus bisa menyebutkan rules dari `.claude/rules/` yang di-import di `CLAUDE.md`.

---

## Opsi 2: Penggunaan Global (Berlaku di Semua Project)

Pendekatan ini membuat rules dan commands tersedia di **semua project** di komputermu — tanpa perlu copy ke setiap project.

### Struktur Global Claude Code

```
~/.claude/
├── CLAUDE.md           ← instruksi global (dibuat manual, lihat di bawah)
├── commands/           ← commands global
├── rules/              ← rules global
└── skills/             ← skills global
```

### Langkah Setup Global

**1. Salin rules dan skills ke `~/.claude/`**

```bash
# Buat direktori jika belum ada
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/rules
mkdir -p ~/.claude/skills

# Salin semua konten
cp /path/ke/ANTIGRAVITY/.claude/commands/* ~/.claude/commands/
cp -r /path/ke/ANTIGRAVITY/.claude/rules/. ~/.claude/rules/
cp -r /path/ke/ANTIGRAVITY/.claude/skills/. ~/.claude/skills/
```

**2. Buat `~/.claude/CLAUDE.md` dengan path yang disesuaikan**

Untuk setup global, path `@` di `CLAUDE.md` harus relatif terhadap `~/.claude/` (bukan project root). Buat file baru:

```bash
cat > ~/.claude/CLAUDE.md << 'EOF'
# Global Engineering Standards

## Aturan yang Selalu Aktif

@rules/rule-priority.md
@rules/rugged-software-constitution.md
@rules/security-mandate.md
@rules/code-completion-mandate.md
@rules/logging-and-observability-mandate.md
@rules/concurrency-and-threading-mandate.md
@rules/core-design-principles.md
@rules/architectural-pattern.md
@rules/code-organization-principles.md
@rules/code-idioms-and-conventions.md
@rules/documentation-principles.md
@rules/project-structure.md

---

## Aturan Kontekstual (Baca Saat Relevan)

- Error handling → `~/.claude/rules/error-handling-principles.md`
- Testing → `~/.claude/rules/testing-strategy.md`
- Security (detail) → `~/.claude/rules/security-principles.md`
- Database → `~/.claude/rules/database-design-principles.md`
- API design → `~/.claude/rules/api-design-principles.md`
- Git workflow → `~/.claude/rules/git-workflow-principles.md`
- Performance → `~/.claude/rules/performance-optimization-principles.md`
- Go → `~/.claude/rules/go-idioms-and-patterns.md`
- TypeScript → `~/.claude/rules/typescript-idioms-and-patterns.md`
- Vue → `~/.claude/rules/vue-idioms-and-patterns.md`
- Python → `~/.claude/rules/python-idioms-and-patterns.md`
- Rust → `~/.claude/rules/rust-idioms-and-patterns.md`
- Flutter → `~/.claude/rules/flutter-idioms-and-patterns.md`
EOF
```

**3. Update path di dalam command files**

Command files yang ada saat ini mereferensikan `.claude/rules/` (relatif terhadap project). Untuk global, path tersebut perlu diubah agar Claude bisa menemukan rules yang ada di `~/.claude/rules/`.

Jalankan script berikut:

```bash
# Ganti .claude/rules/ dan .claude/skills/ menjadi ~/.claude/rules/ dan ~/.claude/skills/
# di semua global command files
for f in ~/.claude/commands/*.md; do
  sed -i 's|\.claude/rules/|~/.claude/rules/|g' "$f"
  sed -i 's|\.claude/skills/|~/.claude/skills/|g' "$f"
done
```

> **Catatan:** Setelah langkah ini, global commands akan mereferensikan `~/.claude/rules/` dan `~/.claude/skills/`. Jika kamu juga pakai per-project, biarkan `.claude/` di project apa adanya — keduanya bisa berjalan berdampingan.

**4. Verifikasi setup global**

Buka Claude Code di direktori **manapun** yang tidak punya `CLAUDE.md` sendiri:

```bash
mkdir /tmp/test-global && cd /tmp/test-global
claude
```

Ketik:
```
Sebutkan rules apa yang sedang aktif?
```

Claude harus bisa menyebutkan rules dari `~/.claude/rules/`.

---

## Opsi 3: Hybrid (Global + Per-Project Override)

Pendekatan terbaik untuk tim atau developer yang punya banyak project dengan stack berbeda.

```
~/.claude/CLAUDE.md          → rules universal (security, design, logging)
~/.claude/commands/          → commands global

my-project/
├── CLAUDE.md                → override: tambah rules spesifik project (misalnya Go idioms)
└── .claude/
    ├── rules/               → rules tambahan spesifik project
    └── commands/            → commands tambahan spesifik project
```

Claude Code menggabungkan kedua CLAUDE.md — global dibaca lebih dulu, project-level menambahkan atau meng-override.

**Contoh `CLAUDE.md` per-project untuk override:**

```markdown
# My Go Microservice Project

## Tambahan Rules untuk Project Ini

@.claude/rules/go-idioms-and-patterns.md
@.claude/rules/project-structure-go-backend.md
@.claude/rules/database-design-principles.md

## Catatan Project Spesifik
- Gunakan PostgreSQL untuk semua storage
- Service port default: 8080
- Env vars wajib: DATABASE_URL, PORT, LOG_LEVEL
```

---

## Panduan Slash Commands

Ketik `/` di Claude Code untuk melihat semua command yang tersedia. Berikut daftar lengkap dan cara pakainya:

---

### `/orchestrator` — Workflow Fitur Lengkap

Gunakan saat membangun **fitur baru** dari awal. Workflow 5 fase: Research → Implement → Integrate → Verify → Ship.

```
/orchestrator
```

Setelah itu, jelaskan fitur yang ingin dibangun:

```
/orchestrator
Saya ingin menambahkan endpoint POST /api/tasks untuk membuat task baru.
Task harus punya title, description, dan due_date. Simpan ke PostgreSQL.
```

**Claude akan:**
1. Membuat `task.md` sebagai tracking
2. Membuat research log di `docs/research_logs/`
3. Menulis test dulu (TDD), baru implementasi
4. Meminta kamu konfirmasi sebelum lanjut ke integration test
5. Melakukan full lint + test sebelum commit
6. Commit dengan format conventional (`feat(tasks): add create task endpoint`)

> **Penting:** Command ini melarang keras melewati fase. Jika ada fase yang gagal, Claude berhenti dan tidak lanjut.

---

### `/quick-fix` — Perbaikan Bug Cepat

Gunakan untuk bug kecil yang **sudah diketahui root cause-nya**, perubahan < 50 baris, atau hotfix.

```
/quick-fix
Bug: fungsi calculateTotal() mengembalikan NaN jika salah satu item price-nya null.
File: src/utils/cart.ts baris 47
```

**Claude akan:**
1. Identifikasi kode yang bermasalah
2. Tulis failing test yang mereproduksi bug
3. Terapkan fix minimal
4. Verifikasi semua test tetap lulus
5. Commit dengan `fix(scope): deskripsi`

**Jangan gunakan untuk:**
- Fitur baru → pakai `/orchestrator`
- Refactoring besar → pakai `/refactor`

---

### `/refactor` — Restrukturisasi Kode

Gunakan untuk restrukturisasi kode sambil mempertahankan perilaku yang sama. **Harus punya tujuan spesifik.**

```
/refactor extract storage interface dari user feature agar bisa di-mock di test
```

```
/refactor pisah handler authentication dari user handler yang ada di handlers/user.go
```

**Claude akan:**
1. Analisis blast radius (file apa saja yang terpengaruh)
2. Buat rencana inkremental di `task.md`
3. Ubah satu langkah sekaligus, test setelah setiap langkah
4. Verifikasi coverage tidak turun
5. Commit dengan `refactor(scope): deskripsi`

**Jangan gunakan:**
```
/refactor apps/backend    ← terlalu samar, gunakan /audit dulu
```

---

### `/audit` — Review Kualitas Kode

Gunakan untuk **inspeksi kualitas** kode yang sudah ada. Tidak menulis kode baru — hanya menemukan isu.

```
/audit src/features/payment
```

```
/audit handlers/user.go handlers/order.go
```

**Claude akan:**
1. Review berdasarkan prioritas: Security → Reliability → Testability → Observability → Code Quality
2. Analisis cross-boundary (integrasi frontend-backend, schema DB, env vars, dependency health)
3. Jalankan lint dan test suite
4. Simpan laporan ke `docs/audits/review-findings-{feature}-{tanggal}.md`

**Output laporan mencakup:**
- Critical Issues (harus diperbaiki sebelum deploy)
- Major Issues (sebaiknya diperbaiki segera)
- Minor Issues (style/naming)
- Hasil lint, test, coverage

**Setelah audit**, pilih workflow yang sesuai:
- Nit/minor → perbaiki langsung
- Fix kecil → `/quick-fix`
- Struktural → `/refactor`
- Fitur hilang → `/orchestrator`

---

### `/perf-optimize` — Optimasi Performa

Gunakan saat punya **data profiling** atau benchmark yang menunjukkan regresi.

```
/perf-optimize
Benchmark menunjukkan endpoint /api/search memakan 800ms untuk 100 item.
Berikut output pprof: [paste output atau path ke file]
```

**Claude akan:**
1. Baca skill dan panduan bahasa yang relevan dari `.claude/skills/perf-optimization/`
2. Buat analisis di `docs/research_logs/{component}-perf-analysis.md`
3. Identifikasi top 3-5 bottleneck
4. **Tunjukkan rencana dan minta persetujuan kamu** sebelum mulai
5. Implementasi satu fix per commit dengan benchmark before/after
6. Commit dengan `perf(scope): deskripsi`

---

### `/adr` — Architecture Decision Record

Gunakan saat memilih antara 2+ pendekatan arsitektur yang berbeda, atau memperkenalkan dependency baru.

```
/adr pilih antara Redis vs in-memory cache untuk session storage
```

```
/adr adopsi Testcontainers untuk integration testing
```

**Claude akan:**
1. Cek nomor ADR terakhir di `docs/decisions/`
2. Buat file `docs/decisions/NNNN-judul.md`
3. Isi dengan: Context, Options Considered (pros/cons/effort), Decision, Consequences

**Format file yang dibuat:**
```
docs/decisions/
├── 0001-use-postgresql-for-storage.md
├── 0002-adopt-testcontainers.md
└── 0003-redis-for-session-cache.md
```

---

### `/debug` — Protokol Debugging Sistematis

Gunakan saat ada bug kompleks, test yang flaky, atau perilaku sistem yang tidak dimengerti.

```
/debug endpoint POST /api/order kadang mengembalikan 500 tapi tidak ada log error yang jelas
```

```
/debug TestUserLogin_Success flaky di CI tapi selalu pass di local
```

**Claude akan:**
1. Buat dokumen sesi di `docs/debugging/{issue}-{tanggal}.md`
2. Formulasikan minimal 2-3 hipotesis yang berbeda
3. Desain validation task untuk setiap hipotesis (query spesifik, command, kode debug)
4. Eksekusi dan dokumentasikan hasil
5. Konfirmasi root cause sebelum menyatakan selesai
6. Serahkan ke `/quick-fix` atau `/orchestrator` untuk perbaikan

---

### `/code-review` — Review Kode dengan Checklist

Gunakan untuk review kode spesifik dengan output berformat rapi. Berbeda dengan `/audit` yang lebih komprehensif, ini fokus pada file/perubahan tertentu.

```
/code-review handlers/payment.go
```

```
/code-review src/features/auth/
```

**Output menggunakan severity tags:**
- `[SEC]` — Security issue
- `[DATA]` — Data integrity / loss risk
- `[RES]` — Resource leak
- `[TEST]` — Testability issue
- `[OBS]` — Observability / logging missing
- `[ERR]` — Error handling
- `[ARCH]` — Architecture violation
- `[PAT]` — Pattern inconsistency

**Contoh output:**
```markdown
## Critical Issues
- [ ] [SEC] Input `userId` tidak divalidasi sebelum digunakan di query — handlers/payment.go:34

## Major Issues
- [ ] [TEST] PaymentService bergantung langsung pada DB, tidak bisa di-mock — handlers/payment.go:12
- [ ] [OBS] Tidak ada logging saat payment gagal — handlers/payment.go:67
```

---

### `/sequential-thinking` — Analisis Iteratif Masalah Kompleks

Gunakan untuk perencanaan atau analisis yang membutuhkan pemikiran bertahap dengan kemungkinan koreksi arah.

```
/sequential-thinking
Bagaimana cara terbaik memigrasikan auth dari JWT stateless ke session-based
tanpa downtime dan tanpa logout user yang sudah login?
```

```
/sequential-thinking
Desain sistem notifikasi real-time untuk 100k concurrent users
dengan budget infrastruktur minimal
```

**Claude akan:**
1. Estimasi jumlah langkah pemikiran yang diperlukan
2. Berpikir step-by-step, setiap langkah membangun di atas yang sebelumnya
3. Merevisi pemikiran sebelumnya jika menemukan kesalahan
4. Menjelajahi alternatif saat diperlukan
5. Memberikan satu jawaban final yang jelas

---

## Cara Rules Bekerja dalam Practice

### Rules yang Selalu Aktif (tidak perlu dipanggil)

Setiap kali kamu membuka Claude Code di project ini, 12 rules berikut otomatis aktif:

| Rule | Apa yang Dijaga |
|------|-----------------|
| `rule-priority.md` | Cara resolve konflik antar rules |
| `rugged-software-constitution.md` | Filosofi dasar: kode defensif |
| `security-mandate.md` | Security tidak bisa dikompromikan |
| `code-completion-mandate.md` | Kode harus lengkap, tidak setengah jadi |
| `logging-and-observability-mandate.md` | Silent failure adalah musuh |
| `concurrency-and-threading-mandate.md` | Race condition harus dicegah |
| `core-design-principles.md` | SOLID, DRY, YAGNI, KISS |
| `architectural-pattern.md` | Testability-first, dependency injection |
| `code-organization-principles.md` | Struktur file dan modul |
| `code-idioms-and-conventions.md` | Konvensi kode yang konsisten |
| `documentation-principles.md` | Kapan dan bagaimana mendokumentasikan |
| `project-structure.md` | Struktur direktori standar |

### Contoh Efeknya

Kamu tidak perlu bilang "jangan hardcode secrets" atau "tambahkan error handling" — Claude sudah tahu karena rules sudah aktif. Misalnya:

```
Buat fungsi untuk connect ke database PostgreSQL
```

Claude otomatis akan:
- Membaca connection string dari environment variable (bukan hardcode)
- Menambahkan error handling
- Menambahkan logging saat connect berhasil/gagal
- Mengembalikan error yang bisa dihandle oleh caller
- Menggunakan context dengan timeout

### Menambah Rules Sendiri

Buat file `.md` baru di `.claude/rules/` dan import di `CLAUDE.md`:

```markdown
<!-- .claude/rules/my-project-rules.md -->
## Aturan Spesifik Project Ini

- Semua response API harus menggunakan struct `APIResponse{Data, Error, Meta}`
- Jangan gunakan `time.Now()` langsung di production code, selalu inject `Clock` interface
```

```markdown
<!-- CLAUDE.md — tambahkan baris ini -->
@.claude/rules/my-project-rules.md
```

---

## Struktur File Referensi

```
project/
├── CLAUDE.md                          ← Entry point, auto-loaded
│
├── .claude/
│   ├── commands/                      ← Slash commands
│   │   ├── orchestrator.md            → /orchestrator
│   │   ├── quick-fix.md               → /quick-fix
│   │   ├── refactor.md                → /refactor
│   │   ├── audit.md                   → /audit
│   │   ├── perf-optimize.md           → /perf-optimize
│   │   ├── adr.md                     → /adr
│   │   ├── debug.md                   → /debug
│   │   ├── code-review.md             → /code-review
│   │   └── sequential-thinking.md     → /sequential-thinking
│   │
│   ├── rules/                         ← 42 rule files
│   │   ├── [12 always-on rules]       ← Di-import CLAUDE.md
│   │   └── [30 contextual rules]      ← Dibaca commands saat relevan
│   │
│   └── skills/                        ← Aset pendukung commands
│       ├── adr/
│       ├── code-review/languages/
│       ├── debugging-protocol/
│       ├── frontend-design/
│       ├── guardrails/
│       ├── mobile-design/
│       ├── perf-optimization/
│       └── sequential-thinking/
│
├── docs/                              ← Dibuat oleh commands saat diperlukan
│   ├── research_logs/                 ← Output /orchestrator fase 1
│   ├── decisions/                     ← Output /adr
│   ├── audits/                        ← Output /audit dan /code-review
│   └── debugging/                     ← Output /debug
│
└── task.md                            ← Tracking progress /orchestrator
```

---

## FAQ

**Q: Apakah bisa dipakai di VS Code / IDE extension?**  
A: Ya. Claude Code extension untuk VS Code dan JetBrains membaca `CLAUDE.md` dan `.claude/commands/` yang sama.

**Q: Apakah commands bisa menerima argumen?**  
A: Ya. Commands yang punya `$ARGUMENTS` di dalamnya akan menerima teks setelah nama command. Contoh: `/audit src/handlers` — "src/handlers" menjadi `$ARGUMENTS`.

**Q: Bagaimana jika project saya tidak pakai semua stack (Go, Vue, Python, dll)?**  
A: Kamu bisa hapus atau abaikan rules yang tidak relevan. Rules kontekstual hanya aktif saat command memanggilnya, jadi tidak ada overhead jika tidak dipakai. Untuk rules always-on di `CLAUDE.md`, kamu bisa hapus import yang tidak relevan.

**Q: Apakah aman di-commit ke repository?**  
A: Ya dan disarankan. `CLAUDE.md` dan `.claude/` di-commit ke repo agar seluruh tim punya standar yang sama. Tidak ada informasi sensitif di dalamnya.

**Q: Bagaimana cara update rules di masa depan?**  
A: Edit langsung file `.md` di `.claude/rules/`. Perubahan langsung aktif di sesi Claude Code berikutnya.

**Q: Bisa pakai global dan per-project sekaligus?**  
A: Ya (lihat Opsi 3: Hybrid). Claude Code membaca keduanya dan menggabungkannya, dengan project-level menambahkan atau meng-override global.

**Q: Commands tampil di `/help` tapi tidak berjalan dengan benar?**  
A: Pastikan file command punya frontmatter `description:` yang valid. Contoh:
```markdown
---
description: Deskripsi command kamu di sini
---
```
Tanpa frontmatter yang valid, command mungkin tidak terdaftar dengan benar.
