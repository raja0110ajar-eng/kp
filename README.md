# Karsa Pandiga

Situs e-commerce dan company profile usaha kelompok siswa PPLG SMKN 2 Klaten, dibuat sebagai
proyek KIK (Kreativitas, Inovasi, & Kewirausahaan). Menjual karya kelompok dan produk reseller
mitra, dengan pengiriman oleh kurir internal tim. Karsa Pandiga bukan produk resmi sekolah.

Fitur inovasi utama: bukti transfer dibaca otomatis (OCR, berjalan di browser pembeli),
dicocokkan dengan total pesanan, lalu selalu diperiksa admin sebelum pembayaran dinyatakan sah.

## Teknologi

Next.js (App Router), Tailwind CSS, Lucide React, Motion, Supabase (database, autentikasi,
penyimpanan file), Tesseract.js, dan Vercel (hosting). Semua dalam paket gratis.

## Menjalankan di komputer

Prasyarat: Node.js 20.9 atau lebih baru dan proyek Supabase (disarankan terpisah dari produksi).

```bash
npm install
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Isi `.env.local` (lihat tabel di bawah), lalu jalankan semua file di `supabase/migrations/`
berurutan di SQL Editor Supabase. Untuk data contoh di proyek **uji**, jalankan
`supabase/seed_demo.sql`. Jangan pernah menjalankannya di produksi.

## Variabel lingkungan

| Nama | Isi | Rahasia? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari dashboard Supabase | Tidak |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kunci publik (publishable) Supabase | Tidak |
| `NEXT_PUBLIC_SITE_URL` | Alamat situs, contoh `https://karsa-pandiga.vercel.app` | Tidak |
| `CRON_SECRET` | Teks acak untuk melindungi `/api/health` (hanya di Vercel) | **Ya** |

Jangan pernah menaruh kunci `service_role` atau kunci rahasia (secret) Supabase di proyek ini.
Variabel `NEXT_PUBLIC_*` tertanam saat build, jadi mengubahnya berarti deploy ulang.

## Migrasi database

Jalankan berurutan: `0001_init_schema.sql`, `0002_payment_settings_and_assets.sql`,
`0003_track_order_details.sql`, `0004_track_rate_limit.sql`, `0005_hardening.sql`.
Admin ditambah lewat SQL (`supabase/seed_admins.sql`), bukan lewat situs.
`supabase/audit.sql` berisi pemeriksaan keamanan yang hanya membaca.

## Perintah

```bash
npm run dev          # server pengembangan
npm run build        # build produksi
npx tsc --noEmit     # periksa tipe
npm run lint         # periksa gaya kode
```

## Struktur

- `src/app/` halaman dan rute (`(public)` katalog dan landing, `(shop)` keranjang, checkout, pesanan, `admin`)
- `src/components/` komponen antarmuka
- `src/lib/` logika (OCR di `ocr/`, pesanan di `orders/`, data admin di `admin/`)
- `src/config/site.ts` semua teks profil dan kontak
- `supabase/` migrasi, seed, dan audit
- `docs/OPERASIONAL.md` panduan mengelola situs yang sudah tayang

## Warna dan tema

Palet diturunkan dari logo dan dipusatkan sebagai token di `src/app/globals.css`.
Dashboard admin selalu terang. Situs publik mengikuti pilihan tema pengunjung.