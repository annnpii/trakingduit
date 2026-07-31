# Ekstraksi Teks UI TrackingDuit

## Global / Metadata
- **App Name:** TrackingDuit
- **Tagline:** Catat keuangan, cepat
- **Description:** Aplikasi personal finance offline-first: catat pemasukan & pengeluaran, OCR nota, multi-wallet, analitik, dan sinkron Google Spreadsheet.

## Halaman Login
- **Judul:** Masuk ke TrackingDuit
- **Deskripsi:** Pakai akun cloud untuk sinkron antar perangkat, atau mode lokal saja.
- **Status:** Mode lokal aktif — data disimpan di browser ini.
- **Mode:** Akun Cloud, Lokal
- **Form:** Email, Password, Nama panggilan, PIN 6 digit (opsional)
- **Aksi:** Daftar, Mulai
- **Error:** PIN harus 6 digit angka, Gagal masuk

## Dashboard
- **Header:** Total saldo, Tampilkan saldo, Sembunyikan saldo, Total saldo semua dompet
- **Info:** {n} dompet aktif · {n} transaksi bulan ini
- **Tile:** Pemasukan, Pengeluaran, Selisih bulan ini, Rata-rata harian, Proyeksi akhir bulan, Kategori terbesar
- **Hint:** Rasio nabung {n}%, Pengeluaran per hari, Berdasarkan laju saat ini
- **Aksi:** Scan Nota, Transaksi, Budget, Target

## Transaksi
- **Placeholder:** Cari merchant, catatan, nominal…
- **Filter:** Semua, Keluar, Masuk, Transfer, Semua dompet, Semua kategori, Reset filter
- **Aksi:** Ekspor CSV, Catat transaksi, Search
- **Empty State:** Tidak ada transaksi, Belum ada catatan pada bulan ini

## Dompet
- **Header:** Total saldo semua dompet, {n} dompet aktif
- **Status:** Diarsipkan
- **Aksi:** Tambah dompet, Ubah, Aktifkan, Arsipkan, Hapus dompet
- **Empty State:** Belum ada dompet, Tambahkan dompet tunai, rekening bank, atau e-wallet

## Anggaran (Budget)
- **Tile:** Total budget, Terpakai, Sisa, Sisa hari
- **Aksi:** Buat budget, Ubah, Hapus
- **Empty State:** Belum ada budget bulan ini, Tetapkan batas pengeluaran per kategori

## Target Tabungan
- **Tile:** Total target, Terkumpul, Kurang, Progres
- **Aksi:** Target Baru, Setor, Arsip, Aktifkan, Ubah, Hapus
- **Label:** {n} hari lagi, Jatuh tempo hari ini, Lewat deadline, nabung {n}/bln

## Tagihan (Bills)
- **Tile:** Tagihan aktif, Rutin bulanan, Jatuh tempo ≤7 hari, Telat bayar
- **Aksi:** Cek pengingat, Tagihan, Tandai lunas, Ubah, Hapus
- **Status:** Selesai, Hari ini, {n} hari lagi, Telat {n} hari

## Analitik & Insight
- **Filter:** Pengeluaran, Pemasukan
- **Chart Header:** Arus kas harian, Komposisi {kategori}, Perbandingan 6 bulan, Tren selisih bulanan, Pengeluaran per hari, Merchant teratas
- **Insight AI:** Ringkasan AI, Langkah bulan depan, Insight otomatis
- **Info:** Insight otomatis dihitung lokal dari data di perangkat.

## Scan Nota
- **Header:** Scan nota belanja
- **Deskripsi:** Foto struk, nominal dan merchant terisi otomatis. Hasil selalu bisa dikoreksi sebelum disimpan.
- **Aksi:** Ambil foto, Pilih gambar
- **Status:** Menyiapkan gambar, OCR gagal

## Pengaturan
- **Profil:** Nama, PIN 6 digit, Simpan, Kunci sekarang, Hapus PIN
- **Sinkron:** Google Spreadsheet, Supabase, Backup, Restore
- **Status:** Gagal sinkron, Belum diset, Mode lokal, Tersinkron, Menyinkron…, Offline
