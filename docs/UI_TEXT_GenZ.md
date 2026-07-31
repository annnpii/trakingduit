# Ekstraksi Teks UI TrackingDuit — Versi Santai (Gen Z 20-30)

## Global / Metadata
- **App Name:** TrackingDuit
- **Tagline:** Cuan dicatat, dompet ke-track
- **Description:** Aplikasi keuangan pribadi yang offline-first — catat pemasukan & pengeluaran secepat kilat. Scan nota otomatis, kelola banyak dompet sekaligus, pantau analitik yang gampang dipahami, sampe sinkron ke Google Spreadsheet.

## Halaman Login
- **Judul:** Gaskeun ke TrackingDuit
- **Deskripsi:** Mau datamu nyambung di semua HP? Pake akun cloud. Kalau simpel-simpelan aja, mode lokal juga oke kok.
- **Status:** Lagi mode lokal nih — data kamu aman tersimpan di browser ini aja.
- **Mode:** Akun Cloud, Mode Lokal
- **Form:** Email, Password, Nama Panggilan, PIN 6 Digit (opsional)
- **Aksi:** Daftar, Gas Mulai
- **Error:** Eh, PIN-nya harus 6 digit angka ya, Gagal masuk nih, coba lagi

## Dashboard
- **Header:** Total Saldo, Lihat Saldo, Sembunyiin Saldo, Total Saldo Semua Dompet
- **Info:** {n} dompet aktif · {n} transaksi bulan ini
- **Tile:** Pemasukan, Pengeluaran, Selisih Bulan Ini, Rata-rata Harian, Perkiraan Akhir Bulan, Kategori Paling Boros
- **Hint:** Nabung {n}% nih, Pengeluaran per hari, Ngitung dari kebiasaan kamu sekarang
- **Aksi:** Scan Nota, Transaksi, Budget, Target

## Transaksi
- **Placeholder:** Cari nama toko, catatan, atau nominal…
- **Filter:** Semua, Keluar, Masuk, Transfer, Semua Dompet, Semua Kategori, Reset Filter
- **Aksi:** Ekspor CSV, Catat Transaksi, Cari
- **Empty State:** Belum ada transaksi nih, Bulan ini masih kosong, yuk mulai catat

## Dompet
- **Header:** Total Saldo Semua Dompet, {n} dompet aktif
- **Status:** Diarsipin
- **Aksi:** Tambah Dompet, Edit, Aktifin, Arsipin, Hapus Dompet
- **Empty State:** Dompetnya masih kosong nih, Yuk tambahin dompet tunai, rekening bank, atau e-wallet kamu

## Anggaran (Budget)
- **Tile:** Total Budget, Udah Kepake, Sisa, Sisa Hari
- **Aksi:** Bikin Budget, Edit, Hapus
- **Empty State:** Belum ada budget bulan ini, Set batas pengeluaran biar gak kebablasan

## Target Tabungan
- **Tile:** Total Target, Udah Kekumpul, Kurang, Progres
- **Aksi:** Target Baru, Setor Dana, Arsip, Aktifin, Edit, Hapus
- **Label:** {n} hari lagi, Jatuh tempo hari ini, Wah, lewat deadline, nabung {n}/bulan

## Tagihan (Bills)
- **Tile:** Tagihan Aktif, Rutin Bulanan, Jatuh Tempo ≤7 Hari, Telat Bayar
- **Aksi:** Cek Pengingat, Tagihan, Tandain Lunas, Edit, Hapus
- **Status:** Beres, Hari Ini, {n} Hari Lagi, Telat {n} Hari

## Analitik & Insight
- **Filter:** Pengeluaran, Pemasukan
- **Chart Header:** Arus Kas Harian, Rincian {kategori}, Perbandingan 6 Bulan, Tren Selisih Bulanan, Pengeluaran per Hari, Toko Langganan Kamu
- **Insight AI:** Rangkuman AI, Langkah Bulan Depan, Insight Otomatis
- **Info:** Tenang, insight-nya diitung langsung di HP kamu kok, gak dikirim ke server.

## Scan Nota
- **Header:** Scan Struk Belanja
- **Deskripsi:** Jepret struknya, nominal & nama toko auto keisi sendiri. Kalau ada yang meleset, tinggal edit dulu sebelum disimpen.
- **Aksi:** Jepret Foto, Pilih dari Galeri
- **Status:** Lagi nyiapin gambar…, OCR-nya gagal nih, coba lagi ya

## Pengaturan
- **Profil:** Nama, PIN 6 Digit, Simpan, Kunci Sekarang, Hapus PIN
- **Sinkron:** Google Spreadsheet, Supabase, Backup, Restore
- **Status:** Gagal Sinkron, Belum Diset, Mode Lokal, Udah Sinkron, Lagi Sinkron…, Offline
