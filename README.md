# TrackingDuit

PWA personal finance offline-first: catat pemasukan/pengeluaran, scan nota (OCR),
multi-wallet, budget, target tabungan, pengingat tagihan, analitik, dan sinkron
dua arah ke Google Spreadsheet.

Implementasi dari [`docs/PRD.md`](docs/PRD.md).
Produksi: **<https://trakingduit.vercel.app>** — deploy: [`docs/DEPLOY-VERCEL.md`](docs/DEPLOY-VERCEL.md).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Jalan langsung tanpa konfigurasi apa pun — semua fitur MVP aktif dengan data lokal.

## Arsitektur

Dexie (IndexedDB) adalah **source of truth di perangkat**. Supabase dan Google
Spreadsheet adalah **target sinkronisasi**, bukan jalur baca utama. Konsekuensinya:

- app tetap penuh fungsi offline dan tanpa satu env var pun,
- semua UI membaca satu jalur data (`useLiveQuery`) sehingga reaktif otomatis,
- konflik diselesaikan pakai `updated_at` — last write wins, sesuai PRD §8.

Untuk pemakaian sehari-hari, **Supabase adalah penyimpanan tahan-lama yang
disarankan** — IndexedDB tetap cache lokal yang bisa dibaca offline, Postgres
salinan yang tidak ikut hilang kalau browser/perangkat hilang. Setup:
[`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md).

Begitu Supabase terkonfigurasi dan user login akun cloud, sinkron berjalan
**otomatis** (`src/lib/sync/auto-sync.tsx`): saat app dibuka, tiap 60 detik, dan
setiap koneksi balik online atau tab kembali difokuskan. Gagal → retry dengan
backoff eksponensial 5 detik sampai maksimal 5 menit. Tombol sinkron manual di
Settings tetap ada untuk memaksa sekarang.

```
UI (React) ──useLiveQuery──> Dexie ──┬── lib/sync/sheets.ts        ──> /api/sync/google-sheet ──> Spreadsheet
                                     └── lib/sync/supabase-sync.ts ──> Supabase (RLS per user)
```

Semua tabel bawa `id`, `created_at`, `updated_at`, `deleted` (soft delete) supaya
bisa disinkronkan dua arah.

## Konfigurasi opsional

Copy `.env.example` → `.env.local`. Tiap blok berdiri sendiri; yang tidak diisi
otomatis mati dengan fallback yang jelas (bukan error).

| Fitur | Env | Kalau kosong |
| --- | --- | --- |
| Akun cloud + sinkron antar perangkat | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Login mode lokal (nama + PIN opsional) |
| Sinkron Spreadsheet | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID` | Tombol sinkron mati, ekspor CSV tetap ada |
| OCR akurasi tinggi | `GOOGLE_VISION_API_KEY` | Tesseract di browser (`ind`), tanpa API key |
| Ringkasan AI | `ANTHROPIC_API_KEY` | Insight rule-based lokal tetap jalan penuh |

### Supabase

Panduan lengkap: [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md). Ringkasnya:

1. Buat project, lalu jalankan [`supabase/schema.sql`](supabase/schema.sql) di SQL editor.
2. Isi `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, lalu `pnpm build`
   (env var dibaca saat build).
3. Login lewat tab **Akun Cloud**. Sinkron langsung jalan otomatis — data lokal
   yang sudah ada ikut ter-push pada sinkron pertama, jadi tidak ada yang hilang.

Row Level Security aktif di semua tabel (`user_id = auth.uid()`), jadi anon key
aman dikirim ke browser. Bucket `receipts` juga per-user folder.

### Google Spreadsheet

1. Google Cloud → aktifkan **Google Sheets API** → buat service account + JSON key.
2. Share spreadsheet target ke email service account sebagai **Editor**.
3. Isi `GOOGLE_SHEET_ID` (bagian `/d/<ID>/edit` di URL) dan `GOOGLE_PRIVATE_KEY`
   (boleh satu baris dengan `\n` literal).

Sinkron dua arah: baris lokal dan baris sheet digabung per `id`, `updated_at`
terbaru menang, sheet ditulis ulang dengan hasil merge, dan baris yang hanya ada
di sheet (mis. diedit manual dari HP orang lain) ditarik ke perangkat.

## Modul

| Modul | Rute | Catatan |
| --- | --- | --- |
| Authentication | `/login` | Lokal (PIN 6 digit, SHA-256) atau Supabase email/password |
| Dashboard | `/dashboard` | Saldo total, arus kas harian, budget, tagihan terdekat |
| Wallet | `/wallets` | Tunai/bank/e-wallet/kartu kredit/investasi, saldo dihitung dari transaksi |
| Transactions | `/transactions` | Filter bulan/tipe/dompet/kategori, cari, ekspor CSV |
| OCR Receipt | `/scan` | Kamera atau file, hasil bisa dikoreksi sebelum jadi transaksi |
| Budget | `/budgets` | Batas per kategori, notifikasi di 80% dan 100% |
| Saving Goals | `/goals` | Progres, deadline, estimasi bulan tercapai |
| Bills Reminder | `/bills` | Pengulangan, pengingat H-n, tandai lunas + auto-catat |
| Analytics | `/analytics` | Donut kategori, tren 6 bulan, pola hari, merchant teratas |
| AI Insight | `/insight` | Rule-based lokal + ringkasan Claude opsional |
| Settings | `/settings` | Tema, PIN, sinkron, impor CSV, backup JSON, kategori, reset |

### OCR

`Foto → downscale → grayscale+kontras → OCR → parsing → koreksi → simpan`.

Parser ([`src/lib/ocr/parser.ts`](src/lib/ocr/parser.ts)) menangani struk
Indonesia: kata kunci total (`grand total`, `total bayar`, `tunai`, …), format
tanggal `dd/mm/yy` dan `13 Mei 2024`, pemisah ribuan titik/koma, plus baris item.
Setiap hasil punya skor `confidence` — di bawah 60% UI minta pengguna cek dulu.

### Integrasi bank / e-wallet

Sesuai PRD §9: tanpa Open Finance resmi, jalur yang tersedia adalah **impor
mutasi CSV** (Settings → Impor mutasi CSV). Kolom tanggal/keterangan/debit/kredit
dideteksi otomatis, baris bisa dicentang satu-satu, dan duplikat (tanggal +
nominal + keterangan sama) dilewati.

## API

Rute berikut ada untuk klien lain (mobile shell, script). Web app-nya sendiri
jalan offline-first dan tidak bergantung padanya.

| Endpoint | Auth | Fungsi |
| --- | --- | --- |
| `POST /api/auth/login` | — | Email+password Supabase, balas `access_token` |
| `GET /api/transactions` | Bearer | Filter `from`, `to`, `wallet_id`, `type`, `limit` |
| `POST /api/transactions` | Bearer | Upsert satu transaksi (validasi Zod) |
| `GET /api/analytics?month=YYYY-MM` | Bearer | Agregat bulan + tren 6 bulan |
| `POST /api/ocr` | — | Google Vision; `501` kalau key kosong (klien fallback Tesseract) |
| `POST /api/sync/google-sheet` | — | Sinkron dua arah; `GET` untuk cek koneksi |
| `POST /api/insight` | — | Ringkasan Claude; `501` kalau key kosong |

Endpoint Bearer memakai token pengguna sehingga RLS Postgres yang menegakkan
kepemilikan data — bukan pengecekan di layer aplikasi.

## Keamanan

- Supabase: JWT + Row Level Security di semua tabel, service role key tidak
  pernah diprefix `NEXT_PUBLIC_`.
- PIN lokal: SHA-256 via WebCrypto. Ini kunci UI, **bukan** enkripsi data —
  IndexedDB tetap terbaca oleh siapa pun yang punya akses fisik ke perangkat dan
  DevTools. Untuk data sensitif, pakai akun cloud + full-disk encryption.
- Halaman Insight hanya mengirim agregat (total, share kategori, tren) ke API AI,
  bukan transaksi mentah, dan hanya ketika tombolnya ditekan.

## PWA

`public/manifest.webmanifest` + `public/sw.js` (network-first untuk navigasi,
cache-first untuk aset statis, `/api/*` tidak pernah di-cache). Service worker
hanya diregistrasi di production build:

```bash
pnpm build && pnpm start
```

## Struktur

```
src/
  app/
    (app)/            halaman dalam shell (guard auth + nav)
    api/              route handler: ocr, insight, sync, transactions, analytics, auth
    login/            halaman masuk
  components/
    charts/           wrapper Recharts
    layout/           app shell, bottom nav, lock screen, month switcher
    transactions/     form + list transaksi
    ui/               primitives (Button, Sheet, Field, Toast, …)
  lib/
    analytics.ts      fungsi agregasi murni (dipakai UI + /api/analytics)
    db.ts repo.ts     Dexie schema + CRUD
    export.ts import.ts  CSV/JSON, parser impor mutasi
    insight.ts        mesin insight rule-based
    ocr/              preprocessing + parser struk
    sync/             sheets.ts, supabase-sync.ts
supabase/schema.sql   tabel, RLS, trigger, view saldo, bucket storage
```

## Roadmap

MVP (login, dashboard, wallet, transaksi, OCR, spreadsheet, analytics) selesai,
plus V2 (AI Insight, saving goals, reminder). Belum dikerjakan dari PRD:

- **Open Banking / Open Finance** — masih impor CSV; butuh partner API resmi.
- **Multi-user family** — schema saat ini satu `user_id` per baris, perlu tabel
  `households` + kebijakan RLS berbasis keanggotaan.
- **Push notification** — notifikasi sekarang in-app; butuh Web Push + VAPID.
- **Sinkron nota ke cloud** — gambar struk sengaja tetap lokal supaya sinkron
  ringan; kalau perlu, unggah ke bucket `receipts` yang sudah disiapkan.
