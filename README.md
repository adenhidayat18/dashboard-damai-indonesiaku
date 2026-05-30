# Dashboard Analitik Mens Rea

**Topik Riset:** Polarisasi Sentimen Publik Terhadap Kontroversi Stand-Up Comedy 'Mens Rea' Pandji Pragiwaksono: Antara Kebebasan Berekspresi dan Penistaan Agama

**Peneliti:** Aden Hidayat — S3 Komunikasi Penyiaran Islam (2026)

---

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts (visualisasi)
- PapaParse (parsing CSV)

## Cara Menjalankan Lokal

```bash
npm install
npm run dev
# Buka http://localhost:3000
```

## Cara Deploy ke Vercel

1. Push ke GitHub repository (Public)
2. Buka vercel.com → New Project → Import repo
3. Vercel otomatis detect Next.js → klik Deploy
4. URL publik akan tersedia dalam 2–3 menit

## Struktur Data

File CSV di `public/data/`:
- `twitter.csv` — 129 tweet berlabel
- `youtube.csv` — 1.466 komentar berlabel

**Label tersedia per baris:**
- `sentiment`: pro_pandji / anti_pandji / skeptis / netral
- `emotion`: kemarahan / penghinaan / kekhawatiran / dukungan / ejekan_ironi / kekecewaan / kelegaan / informatif
- `valence`: positive / negative / neutral
- `framing`: hukum_pidana / seni_kebebasan / identitas_agama (Twitter only)

## Komponen Dashboard

| Komponen | Keterangan |
|---|---|
| Header + StatCards | Wajib 1–2 |
| Timeline Chart | Wajib 3 — eskalasi viral Twitter |
| Sentiment Pie (3 chart) | Wajib 3–4 — per platform + gabungan |
| Valence Bar Chart | Label baru — muatan emosi per platform |
| Emotion Bar Chart | Label baru — 8 kategori emosi |
| Actor Mention Chart | Bonus — aktor paling banyak disebut |
| Framing + Akun Type | Bonus — cluster framing + media vs publik |
| Tabel Interaktif | Wajib 6 — filter 3 dimensi + search + pagination |
| Catatan Metodologis | Wajib 7 |

---

*"AI mempercepat produksi; integritas ilmiah tetap milik peneliti."*
