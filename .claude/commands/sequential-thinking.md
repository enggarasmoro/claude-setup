---
description: Pemecahan masalah kompleks secara iteratif dengan revisi dan branching - untuk perencanaan multi-langkah yang membutuhkan koreksi arah
---

# Sequential Thinking

Masalah yang akan dianalisis: **$ARGUMENTS**

## Kapan Digunakan
- Memecah masalah kompleks menjadi langkah-langkah yang bisa dikelola
- Perencanaan dan desain yang membutuhkan penyempurnaan iteratif
- Analisis yang mungkin perlu koreksi arah di tengah jalan
- Masalah di mana scope penuh muncul selama analisis
- Solusi multi-langkah yang membutuhkan konteks antar langkah
- Generasi dan verifikasi hipotesis

---

## Metodologi

Sequential thinking mengikuti proses dinamis:

1. **Estimasi awal**: Mulai dengan estimasi jumlah pemikiran yang diperlukan, tapi tetap fleksibel
2. **Analisis iteratif**: Kerjakan pemikiran secara berurutan sambil membangun konteks
3. **Kemampuan revisi**: Pertanyakan atau revisi pemikiran sebelumnya saat pemahaman makin dalam
4. **Eksplorasi cabang**: Jelajahi pendekatan alternatif saat diperlukan
5. **Siklus hipotesis**: Generate hipotesis, verifikasi terhadap rantai pemikiran, ulangi
6. **Konvergensi**: Lanjutkan sampai mencapai solusi yang memuaskan

---

## Instruksi

### Struktur Pemikiran

Setiap pemikiran dalam urutan harus mencakup:
- **Nomor pemikiran** dan **estimasi total** yang mungkin berubah
- Konten pemikiran yang jelas
- Apakah pemikiran berikutnya diperlukan

Saat merevisi pemikiran sebelumnya:
```
Pemikiran [N/Total]: Setelah direnungkan, asumsi di pemikiran 3 tentang X salah karena Y...
[isRevision: true, revisesThought: 3]
```

Saat branching:
```
Pemikiran [N/Total]: Menjelajahi alternatif dari pemikiran X untuk pendekatan...
[branchFromThought: X, branchId: "alternative-approach"]
```

---

### Panduan Proses

**Memulai:**
- Estimasi pemikiran yang diperlukan berdasarkan kompleksitas masalah
- Mulai dengan pemikiran 1, bangun konteks dan pendekatan
- Set totalThoughts secara konservatif; bisa disesuaikan nanti

**Selama analisis:**
- Bangun di atas pemikiran sebelumnya sambil mempertahankan konteks
- Saring informasi yang tidak relevan di setiap langkah
- Ungkapkan ketidakpastian saat ada
- Jangan ragu merevisi jika menemukan kesalahan atau pendekatan yang lebih baik
- Sesuaikan totalThoughts naik/turun seiring scope masalah makin jelas

**Siklus hipotesis:**
1. Generate hipotesis berdasarkan pemahaman saat ini
2. Verifikasi terhadap rantai pemikiran sebelumnya
3. Jika verifikasi gagal → revisi atau buat cabang baru
4. Ulangi sampai hipotesis tervalidasi

**Penyelesaian:**
- Hanya akhiri saat benar-benar puas dengan solusinya
- Berikan satu jawaban akhir yang jelas
- Pastikan jawaban langsung menjawab masalah asli

---

### Format Output

Presentasikan sequential thinking dalam format terstruktur:
```
Pemikiran [N/Total]: [Konten pemikiran saat ini]
[Jika revisi: "Ini merevisi pemikiran X karena..."]
[Jika branching: "Branching dari pemikiran X untuk mengeksplorasi..."]

[Lanjutkan ke pemikiran berikutnya jika diperlukan]

Solusi: [Jawaban yang jelas dan langsung untuk masalah asli]
```

---

## Prinsip Utama

- **Fleksibilitas di atas kekakuan**: Sesuaikan pendekatan seiring pemahaman makin dalam
- **Revisi adalah kekuatan**: Mengoreksi arah menunjukkan penalaran yang baik
- **Berbasis hipotesis**: Generate dan uji hipotesis secara iteratif
- **Sadar konteks**: Pertahankan kesadaran pemikiran sebelumnya sambil terus maju
- **Kejelasan saat selesai**: Berikan satu jawaban akhir yang jelas

Untuk contoh konkret sequential thinking, lihat `.claude/skills/sequential-thinking/resources/examples.md`.
