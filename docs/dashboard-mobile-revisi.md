# Dashboard Mobile — UI/UX Revision

Lakukan revisi pada halaman Dashboard Mobile agar lebih responsif, modern, dan mengikuti prinsip dashboard sebagai halaman ringkasan (overview).

---

## 1. Perbaiki Greeting User

**Masalah:**
Nama pengguna pada greeting masih terpotong.

- Sekarang: `Hai, flakoro1...`
- Seharusnya: `Hai, Flakoro10`

**Perbaikan:**
- Gunakan layout yang fleksibel (`Flexible`/`Expanded`).
- Jangan memotong nama jika ruang masih tersedia.
- Gunakan ellipsis hanya jika nama benar-benar terlalu panjang.
- Pastikan responsif di semua ukuran layar.

---

## 2. Tambahkan Display Name

Greeting Dashboard harus menggunakan **Display Name**, bukan username login. Tambahkan fitur ini pada halaman Profil/Pengaturan.

**Ketentuan:**
- User dapat mengubah Display Name.
- Setelah disimpan, Dashboard langsung menggunakan nama baru tanpa perlu logout.
- Simpan secara permanen di database/local storage.
- Jika Display Name kosong, gunakan username sebagai fallback.

**Validasi:**
- Minimal 3 karakter.
- Maksimal 30 karakter.
- Tidak boleh hanya berisi spasi.

---

## 3. Perkecil Komponen Tanggal

Button pemilih bulan (contoh: "Agustus 2026") terlalu besar pada tampilan mobile.

**Revisi:**
- Kurangi tinggi komponen.
- Kurangi padding horizontal dan vertikal.
- Perkecil ukuran font bila diperlukan.
- Tetap nyaman disentuh (touch-friendly).
- Buat tampilan lebih compact agar area greeting memiliki ruang lebih luas.
- Sesuaikan proporsi dengan desain Dashboard secara keseluruhan.

---

## 4. Ganti Section "Budget Bulan Ini" Menjadi "Tagihan"

> Catatan: Ini bukan perubahan pada shortcut menu, melainkan pada card/section besar yang berada di bawah shortcut Dashboard.

- Saat ini: **Budget Bulan Ini**
- Ubah menjadi: **Tagihan**

Section ini harus menjadi ringkasan tagihan pengguna, menampilkan:
- Total tagihan bulan ini.
- Maksimal 3 tagihan dengan jatuh tempo terdekat.
- Status tagihan: Belum Dibayar, Jatuh Tempo Hari Ini, Terlambat, Sudah Dibayar.
- Empty state jika pengguna belum memiliki tagihan.

**Jangan tambahkan tombol "Lihat Semua".** Jika pengguna ingin melihat seluruh daftar atau mengelola tagihan, arahkan ke halaman Tagihan melalui shortcut atau menu.

---

## 5. Sederhanakan Dashboard

Dashboard harus berfungsi sebagai **overview**, bukan halaman untuk mengelola seluruh data.

### Section Transaksi
- Tampilkan maksimal 3 transaksi terbaru.
- Jangan tampilkan tombol "Lihat Semua".
- Untuk melihat riwayat lengkap, membuka detail, mengedit, atau menghapus transaksi, pengguna harus masuk ke halaman Transaksi melalui shortcut atau Bottom Navigation.
- Tambahkan indikator kecil, contoh: *"3 transaksi terbaru"*.

### Section Tagihan
- Tampilkan maksimal 3 tagihan terdekat.
- Jangan tampilkan tombol "Lihat Semua".
- Untuk melihat seluruh daftar atau mengelola tagihan, pengguna harus masuk ke halaman Tagihan melalui shortcut atau menu.
- Tambahkan indikator kecil, contoh: *"3 tagihan terdekat"*.

---

## 6. Empty State

Jika belum ada data, tampilkan pesan berikut beserta ilustrasi sederhana agar tidak terlihat kosong:

**Transaksi:**
> Belum ada transaksi. Tambahkan transaksi pertama melalui tombol (+) atau halaman Transaksi.

**Tagihan:**
> Belum ada tagihan. Tambahkan tagihan melalui halaman Tagihan.

---

## 7. Responsivitas Dashboard

Pastikan Dashboard telah dioptimalkan untuk berbagai ukuran layar Android.

**Checklist:**
- [ ] Tidak ada teks yang terpotong.
- [ ] Tidak ada widget saling bertabrakan.
- [ ] Tidak ada overflow.
- [ ] Spacing konsisten.
- [ ] Alignment rapi.
- [ ] Layout fleksibel.
- [ ] Visual hierarchy lebih baik.
- [ ] Mengikuti design system modern, premium, minimalis, dan mobile-first.

---

## Expected Result

Setelah revisi:
1. Greeting menggunakan Display Name yang dapat diedit pengguna.
2. Nama pengguna tampil penuh tanpa terpotong.
3. Komponen tanggal lebih kecil dan proporsional.
4. Section "Budget Bulan Ini" diganti menjadi "Tagihan".
5. Dashboard hanya menampilkan ringkasan (overview), bukan daftar lengkap.
6. Section Transaksi dan Tagihan hanya menampilkan maksimal 3 data terbaru/terdekat, tanpa tombol "Lihat Semua".
7. Untuk melihat data lengkap atau mengelola data, pengguna diarahkan ke halaman Transaksi dan Tagihan melalui shortcut atau menu.
8. Seluruh Dashboard tampil lebih modern, bersih, responsif, dan konsisten dengan design system aplikasi.
