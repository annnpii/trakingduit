# Prompt buat Kimi CLI — Fitur Gaji + Kalkulasi Tagihan (TrackingDuit)

---

Woy Kimi, gue ada kerjaan buat lu. Gue lagi ngebangun app namanya **TrackingDuit** — aplikasi personal finance offline-first (React/TypeScript, kemungkinan pake IndexedDB atau local storage buat data lokal, sync ke Google Spreadsheet & Supabase buat cloud). Nah sekarang gue mau nambahin fitur baru di halaman **Tagihan (Bills)**, jadi tolong bikinin ya, gue jelasin detail biar lu gak bingung.

## Konteks Fitur yang Udah Ada
Halaman Tagihan sekarang isinya:
- Tile: Tagihan Aktif, Rutin Bulanan, Jatuh Tempo ≤7 Hari, Telat Bayar
- Aksi: Cek Pengingat, Tagihan (list), Tandai Lunas, Ubah, Hapus
- Status per tagihan: Selesai, Hari Ini, {n} Hari Lagi, Telat {n} Hari

## Yang Gue Mau Ditambahin

Gue mau user bisa input **gaji bulanan** mereka, terus sistem otomatis ngitung sisa duit setelah dipotong semua tagihan aktif. Jadi user langsung ngeh "gaji gue cukup gak buat bayar semua tagihan bulan ini".

### 1. Input Gaji
- Tambahin form/field baru buat input **Gaji Bulanan** (nominal rupiah, angka aja, gak usah ribet kayak multi-income dulu — simpel, 1 sumber gaji per bulan)
- Gaji ini sifatnya **auto-carry** ke bulan berikutnya (gak perlu diinput ulang tiap bulan), tapi user bisa ubah kapan aja kalau gajinya berubah
- Simpen histori gaji per bulan juga ya (jangan cuma overwrite), soalnya nanti mungkin kepake buat analitik/insight AI yang udah ada di app

### 2. Kalkulasi Otomatis
Begitu gaji udah keisi, sistem harus otomatis ngitung dan nampilin di tile baru:
- **Sisa Gaji Setelah Tagihan** = Gaji Bulanan − Total Tagihan Aktif (yang statusnya belum lunas bulan ini)
- **Persentase Tagihan dari Gaji** = (Total Tagihan Aktif / Gaji Bulanan) × 100%

### 3. Insight/Warning Otomatis
Bikin logic buat kasih pesan beda-beda tergantung persentase:
- Kalau persentase **< 50%** → tampilin pesan santai kayak "Mantap, tagihan cuma makan {n}% gaji kamu bulan ini"
- Kalau persentase **50-100%** → tampilin warning kuning kayak "Hati-hati, {n}% gaji abis buat tagihan nih"
- Kalau persentase **> 100%** (tagihan lebih gede dari gaji) → warning merah, kayak "Duh, total tagihan udah lebih gede dari gaji kamu bulan ini"

### 4. Empty State
Kalau user belum input gaji sama sekali, tampilin state kosong:
- Judul: "Belum ada gaji yang keinput"
- Deskripsi: "Isi gaji bulanan dulu biar TrackingDuit bisa itung sisa duit kamu setelah bayar tagihan"
- Ada tombol CTA buat langsung ke form input gaji

### 5. Privasi Nominal
Sama kayak fitur "Tampilkan/Sembunyiin Saldo" yang udah ada di Dashboard, gaji juga data sensitif — jadi tolong kasih toggle show/hide juga buat nominal gaji ini (bisa reuse komponen yang sama kalau ada).

## Requirement Teknis
- Bikin **komponen terpisah** (misal `SalaryInput.tsx` dan `BillsSummaryCard.tsx` atau sejenisnya), jangan numpuk semua di satu file gede
- Gaji disimpen di local storage/IndexedDB dulu (offline-first, sesuai arsitektur app), tapi struktur datanya bikin gampang buat nanti disinkron ke Supabase/Google Spreadsheet
- Kalkulasi persentase & sisa gaji harus **reaktif** — begitu user tambah/edit/hapus tagihan atau ubah gaji, angka di tile langsung update, gak perlu refresh
- Handle edge case: gaji 0 atau belum diisi (jangan sampe divide by zero pas ngitung persentase)
- Format nominal rupiah pake separator ribuan (contoh: 5.000.000), dan kasih format input yang enak dipake (auto-format pas ngetik)
- Kalau ada validasi input, samain gaya bahasanya sama error message yang udah ada di app (santai tapi jelas, kayak "Eh, PIN-nya harus 6 digit angka ya" — pake nada yang sama buat error di form gaji ini)

## Gaya Bahasa UI (WAJIB DIIKUTIN)
App ini pake bahasa Indonesia santai/casual, target user Gen Z umur 20-30. Jadi semua teks yang lu bikin (label, tombol, pesan) HARUS ngikutin gaya ini, contoh biar lu kebayang:
- "Belum ada gaji yang keinput" (bukan "Data gaji tidak ditemukan")
- "Mantap, tagihan cuma makan {n}% gaji kamu bulan ini"
- "Duh, total tagihan udah lebih gede dari gaji kamu bulan ini"
- Tombol pake kata kayak "Simpan Gaji", "Ubah Gaji" — bukan "Submit" atau "Update Data"

Jangan bikin bahasa yang kaku/formal ala aplikasi korporat ya, ini app buat anak muda.

## Output yang Gue Mau
1. Komponen React/TypeScript buat input gaji + tile ringkasan (Sisa Gaji, Persentase Tagihan)
2. Logic kalkulasi (bisa dipisah jadi util function/hook, misal `useSalaryCalculation.ts`)
3. Empty state component
4. Tipe/interface TypeScript buat data gaji (misal `SalaryRecord { month: string, amount: number, createdAt: Date }`)
5. Kalau bisa, sekalian contoh unit test buat logic kalkulasinya (edge case gaji 0, tagihan lebih besar dari gaji, dll)

Gaskeun, kerjain step by step aja biar gue bisa review satu-satu, gak usah sekali generate semua langsung.
