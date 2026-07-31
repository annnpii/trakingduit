# Deploy TrackingDuit ke Vercel

## ✅ Sudah live — <https://trakingduit.vercel.app>

Deploy pertama selesai 2026-07-27, scope `anpikeke-6896`.
Deployment id `dpl_BMDhea4SZCHHda4Dm8cG3saFg5ag`.

### ⚠️ Nama domain: ada dua ejaan, jangan ketuker

Nama project awalnya ikut nama folder — `trakingduit`, **tanpa huruf c**.
Buka `trackingduit.vercel.app` (dengan c) hasilnya **404 DEPLOYMENT_NOT_FOUND**.

Project **sudah di-rename** jadi `trackingduit`, tapi alias produksi baru ikut
pindah **setelah deploy prod berikutnya**. Kondisi sekarang:

| Domain | Status |
| --- | --- |
| `trakingduit.vercel.app` | ✅ 200 — dipakai sekarang |
| `trackingduit.vercel.app` | 404 sampai ada `deploy --prod` lagi |

Setelah redeploy prod berikutnya, domain aktif pindah ke ejaan dengan c.
Kalau sudah pindah: **update Supabase Site URL + Redirect URLs ke domain baru**,
kalau tidak login cloud dari HP akan rusak.

Jangan pakai `vercel alias set` untuk menambal ini — alias ke URL deployment kena
Deployment Protection dan malah redirect ke halaman login Vercel (302 ke
`vercel.com/sso-api`), bukan ke app. Sudah dicoba dan di-rollback.

Redeploy setelah ubah kode:

```bash
cd "/home/annnpii/Product development annpii/trakingduit"
pnpm dlx vercel@latest deploy --prod --yes
```

Catatan hasil deploy pertama:

- `vercel link` **menambah baris `VERCEL_OIDC_TOKEN` ke `.env.local`** (append,
  tidak menimpa). Var Supabase tetap utuh — tapi cek lagi kalau link diulang.
- Smoke run pertama sempat memunculkan `net::ERR_FAILED` (8 error, dedup jadi
  2 baris); run kedua bersih dengan **1 × 501** saja. Transien, warm-up edge
  cache / service worker pada deploy baru. Jangan dikejar kalau tidak berulang.
- `googleapis` **tidak** kena batas ukuran serverless function. Build lolos.

Sisa yang belum: Supabase Auth **Site URL** / **Redirect URLs** masih localhost
(lihat bagian di bawah).

---

## Kondisi awal (terverifikasi sebelum deploy)

| Hal | Status |
| --- | --- |
| Folder | `/home/annnpii/Product development annpii/trakingduit` — **ada spasi di path, selalu quote** |
| Git | **belum ada repo** (`git rev-parse` gagal). Belum ada remote. |
| `vercel` CLI | belum terpasang |
| `gh` CLI | belum terpasang |
| Node / pnpm | v26.4.0 / 11.17.0 |
| `pnpm build` | bersih, 24 rute |
| `.vercelignore` | **sudah dibuat** — wajib, tanpa itu upload ~1.5 GB (`node_modules` 874M + `.next` 611M) |
| `.gitignore` | sudah benar: `.env*` diabaikan, `!.env.example` dikecualikan, `.vercel` diabaikan |
| `next.config.ts` | `turbopack.root` pakai `path.resolve(import.meta.dirname)` — relatif, aman di CI |
| API routes | 6 rute, semua `export const runtime = "nodejs"` — kompatibel Vercel |

Env yang ada di `.env.local` dan **wajib ikut ke Vercel** (dua-duanya
`NEXT_PUBLIC_`, dibaca saat build):

```
NEXT_PUBLIC_SUPABASE_URL=https://oeayigvhngzfimvbmyxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```

Sisanya (`GOOGLE_*`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) kosong —
biarkan kosong, semua fitur itu fallback secara eksplisit (501 + hint), bukan error.

## Jalur deploy: CLI langsung, tanpa GitHub

Paling sedikit langkah dan tidak butuh akun GitHub.

```bash
cd "/home/annnpii/Product development annpii/trakingduit"
pnpm dlx vercel@latest login     # interaktif — user yang jalankan
pnpm dlx vercel@latest link      # buat/pilih project
pnpm dlx vercel@latest --prod    # build di Vercel, deploy production
```

**Langkah interaktif harus dijalankan user sendiri** lewat prefix `!` di prompt
Claude Code (mis. `! pnpm dlx vercel@latest login`) supaya outputnya masuk ke
percakapan. Jangan coba otomatiskan `vercel login` — butuh klik link di browser.

Kalau user mau CI/CD dari GitHub (tiap push auto-deploy), itu jalur alternatif:
`git init` + commit + buat repo + import di dashboard Vercel. Tanyakan dulu,
jangan asumsikan — jalur CLI sudah cukup untuk deploy pertama.

## Env var di Vercel

`NEXT_PUBLIC_*` di-inline saat build, jadi harus ada **sebelum** build jalan,
dan setiap perubahan butuh redeploy.

```bash
pnpm dlx vercel@latest env add NEXT_PUBLIC_SUPABASE_URL production
pnpm dlx vercel@latest env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

Ulangi untuk `preview` kalau mau preview deployment ikut jalan.
Nilai ambil dari `.env.local` (jangan tampilkan isi key lengkap ke chat).

## Wajib: update Supabase Auth URL

Ini paling sering kelewat. Setelah dapat domain produksi
(`https://<project>.vercel.app`), buka dashboard Supabase →
**Authentication** → **URL Configuration**:

- **Site URL** → ganti ke domain Vercel (default masih `http://localhost:3000`).
- **Redirect URLs** → tambahkan `https://<project>.vercel.app/**` dan
  biarkan `http://localhost:3000/**` untuk development.

Tanpa ini, link konfirmasi email mengarah ke `localhost:3000` dan user tidak
bisa menyelesaikan pendaftaran dari HP.

## Verifikasi setelah deploy

1. `curl -sI https://<domain>` → 200.
2. Buka `/login` di browser → tab **Akun Cloud** harus muncul. Kalau cuma tab
   Lokal, berarti env var Supabase tidak terbaca saat build → cek env di Vercel
   lalu redeploy. (Catatan: HTML SSR `/login` cuma spinner sebelum hydration,
   jadi `curl | grep "Akun Cloud"` **selalu** 0 match — itu bukan bug, verifikasi
   harus lewat browser sungguhan atau Playwright.)
3. Login akun cloud → Settings → badge Supabase harus **Tersinkron** (hijau).
4. Smoke terhadap domain produksi:
   `SKIP_OCR=1 node scripts/smoke.mjs https://<domain> /tmp/td-prod-shots`
   Ekspektasi: lolos dengan **1 × 501** (dari cek `/api/sync/google-sheet`,
   lihat HANDOFF §1). Bukan 0.
5. PWA: buka di HP, cek prompt "Add to Home Screen" muncul (service worker cuma
   aktif di production build — di Vercel otomatis terpenuhi).

## Risiko yang sudah diketahui

- **`googleapis` besar.** Kalau build Vercel gagal karena batas ukuran serverless
  function (250 MB unzipped), yang kena pasti `/api/sync/google-sheet`.
  Perbaikan: ganti import `googleapis` jadi `google-auth-library` + fetch REST
  Sheets API langsung. Jangan preemptive — tunggu build gagal dulu.
- **Build script pnpm.** `pnpm-workspace.yaml` punya `allowBuilds` +
  `onlyBuiltDependencies` (sharp, tesseract.js, unrs-resolver). Kalau Vercel
  skip build script dan sharp gagal, set env `PNPM_ALLOW_BUILD` atau tambah
  `"pnpm": { "onlyBuiltDependencies": [...] }` di `package.json`.
- **`.env.local` jangan ikut ter-upload.** Sudah ditutup `.vercelignore`.
  Verifikasi sekali dengan `pnpm dlx vercel@latest build --debug` atau cek
  daftar file yang diunggah di output deploy.
