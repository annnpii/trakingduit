# Setup Supabase — TrackingDuit

Target: data tersimpan di cloud, tidak hilang walau HP/browser hilang, dan
tersinkron otomatis antar perangkat.

Sisi kode sudah siap semua. Yang tersisa cuma bagian yang butuh akun kamu
(buat project + jalankan schema + tempel 2 kunci).

---

## 1. Buat project Supabase

1. Masuk ke <https://supabase.com> → **New project**.
2. Isi nama (`trackingduit`), password database (simpan di password manager —
   ini bukan password login kamu, tapi kredensial Postgres), region **Southeast
   Asia (Singapore)** biar latensi dari Indonesia rendah.
3. Tunggu provisioning selesai (~2 menit).

## 2. Jalankan schema

1. Dashboard project → menu kiri **SQL Editor** → **New query**.
2. Copy seluruh isi [`supabase/schema.sql`](../supabase/schema.sql), paste, **Run**.
3. Harus sukses tanpa error. Script-nya idempoten (`create table if not exists`,
   `drop policy if exists`), jadi aman dijalankan ulang kalau perlu.

Yang dibuat: 11 tabel, Row Level Security di semua tabel, trigger bootstrap
profil, view saldo dompet, dan bucket storage `receipts`.

## 3. Tempel kunci ke `.env.local`

Dashboard → **Project Settings** → **API**. Ambil dua nilai:

| Di dashboard | Ke variabel |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

File `.env.local` sudah dibuat di root project, tinggal diisi:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Anon key **aman** ada di browser — RLS di Postgres yang menegakkan kepemilikan
data, bukan kerahasiaan key. Yang tidak boleh bocor itu `service_role` key, dan
itu tidak pernah diprefix `NEXT_PUBLIC_`.

## 4. Restart server

Env var dibaca saat build, jadi wajib rebuild:

```bash
pnpm build && pnpm start
```

## 5. Login akun cloud

Buka <http://localhost:3000/login> → tab **Akun Cloud** (tab ini baru muncul
setelah env var terisi) → daftar pakai email + password.

Data lokal yang sudah ada ikut ke-push ke akun baru pada sinkron pertama, jadi
tidak ada yang hilang saat pindah dari mode lokal.

### Konfirmasi email

Project Supabase baru default-nya **wajib konfirmasi email**
(`mailer_autoconfirm: false`). Artinya setelah daftar, Supabase mengirim link
konfirmasi dan belum memberi sesi sampai link itu diklik. **Tanpa sesi, sinkron
tidak jalan** walau app terlihat sudah masuk.

App sekarang menangani ini secara eksplisit: kalau pendaftaran belum
terkonfirmasi, muncul pesan *"Akun dibuat. Cek email untuk konfirmasi dulu, lalu
masuk lagi lewat tab Akun Cloud."* — bukan diam-diam masuk mode lokal.

Dua pilihan:

- **Konfirmasi lewat email** (disarankan) — klik link di inbox, lalu login lagi.
  Email tervalidasi, jadi reset password nanti bisa dipakai.
- **Matikan konfirmasi** (paling cepat, untuk pemakaian pribadi) — dashboard →
  **Authentication** → **Sign In / Providers** → **Email** → matikan
  *Confirm email* → Save. Setelah itu daftar langsung dapat sesi.
  Konsekuensi: salah ketik email tidak ketahuan dan reset password tidak bisa.

Verifikasi berhasil: badge Supabase di Settings berubah dari **Mode lokal**
(oranye) jadi **Tersinkron** (hijau).

## 6. Verifikasi

Settings → blok **Sinkronisasi** → baris Supabase harus menunjukkan badge
**Tersinkron** dan teks "Sinkron otomatis tiap menit · terakhir …".

Cek juga di dashboard Supabase → **Table Editor** → `transactions`, barisnya
harus muncul di sana.

---

## Cara kerja sinkron

Sinkron **otomatis**, tidak perlu pencet tombol. Dipicu oleh:

- app dibuka / tab difokuskan,
- interval 60 detik,
- event `online` (koneksi balik setelah putus),
- tab kembali visible.

Kalau gagal, retry pakai backoff eksponensial 5 detik → maksimal 5 menit.
Tombol **Sinkron** manual di Settings tetap ada untuk memaksa sekarang.

Arah data tetap seperti sebelumnya: IndexedDB adalah cache lokal yang bisa
dibaca offline, Postgres adalah salinan tahan-lama. Konflik diselesaikan
`updated_at` last-write-wins.

Tabel yang disinkronkan: `wallets`, `categories`, `transactions`, `budgets`,
`saving_goals`, `bills`. Gambar struk (`ocr_receipts`) sengaja tetap lokal
supaya sinkron ringan — kalau mau ikut cloud, bucket `receipts` sudah disiapkan
tinggal diimplementasikan.

## Catatan penting

- **Offline tetap jalan.** Semua tulisan masuk IndexedDB dulu, di-push saat
  koneksi balik. Data tidak hilang saat offline.
- **Satu perangkat, dua akun.** `signOut` menghapus profil lokal tapi *tidak*
  menghapus tabel data. Kalau akun lain login di browser yang sama, data akun
  lama akan ikut ter-push ke akun baru. Untuk sekarang: pakai **Reset semua
  data** di Settings sebelum ganti akun, atau pakai browser profile terpisah.
- **Backup tambahan.** Supabase free tier tidak punya point-in-time recovery.
  Untuk arsip jangka panjang, pakai **Unduh backup JSON** di Settings secara
  berkala, atau aktifkan sinkron Google Spreadsheet sebagai mirror kedua.
