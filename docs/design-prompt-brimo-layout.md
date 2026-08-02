# Prompt Desain & Layout — Referensi BRImo untuk TrakingDuit

> Dokumen ini berisi kumpulan prompt desain/layout yang bisa langsung dipakai (di Claude, Cursor, v0, Figma AI, dll) untuk mengubah tampilan **trakingduit.vercel.app** agar terinspirasi dari UI aplikasi **BRImo**, tanpa mengubah struktur folder/file project yang sudah ada. Fokusnya murni pada **UI/UX layer** (warna, tipografi, komponen, tata letak) — bukan arsitektur kode.

---

## 0. Ringkasan Referensi (dari gambar BRImo)

Dari 3 screenshot yang dipakai sebagai acuan:
1. **Layar Login** — background gradasi biru tua ke biru muda, logo "BRImo" di atas, ilustrasi 2 karakter kartun menyambut, teks sapaan besar ("Selamat Datang" / "Hai, Selamat Datang!"), form input No. HP/Username & Password dalam card putih rounded, tombol "Login" full-width biru solid, tombol fingerprint bulat di sampingnya, link "Lupa Password?".
2. **Layar Dashboard/Home** — card saldo besar di atas (judul kecil "Saldo Rekening" + nominal besar), lingkaran progress/donut chart budget (misal "65% Pengeluaran") di bawahnya, grid menu cepat berisi ikon-ikon (Mutasi, Transfer, BRIZZI, Top Up Wallet, QRIS, Listrik, Pulsa, Lainnya) dengan icon berwarna di dalam kotak rounded, bottom navigation bar dengan 4-5 ikon.
3. **Layar Daftar Rekening/Kartu** — card saldo total di atas, list card rekening/kartu (tiap card beda warna: hitam, biru, hijau) menampilkan nomor rekening & saldo masing-masing, tombol "+ Buka Rekening Baru" di bagian bawah.

**Ciri khas visual yang konsisten:**
- Palet warna: biru BRI (`#00529C` – `#0060AF`) sebagai warna utama, dipadukan gradasi ke biru muda/putih, aksen oranye untuk floating action button.
- Sudut membulat besar (radius 16–24px) di semua card & tombol.
- Shadow lembut (soft elevation), bukan border tegas.
- Ilustrasi/mascot playful di layar onboarding & login.
- Tipografi tebal untuk angka besar (saldo), tipografi medium untuk label.
- Layout mobile-first, konten disusun vertikal dalam card-card terpisah dengan jarak (spacing) konsisten.

---

## 1. Prompt: Design System / Style Guide

```
Terapkan design system baru ke website trakingduit.vercel.app tanpa mengubah struktur folder/komponen yang ada, hanya ubah styling (CSS/Tailwind/theme):

WARNA:
- Primary: gradasi biru dari #003D7A ke #0072C6 (dipakai di header, tombol utama, background hero/login)
- Secondary/Accent: oranye #FF7A00 (dipakai untuk floating action button / highlight penting)
- Background halaman: putih #FFFFFF atau abu sangat muda #F5F7FA
- Card background: putih dengan shadow lembut
- Teks utama: abu gelap #1A1A1A / biru tua untuk judul
- Teks sekunder: abu #6B7280

TIPOGRAFI:
- Font sans-serif modern (contoh: Inter, Poppins, atau font yang sudah dipakai di project)
- Angka nominal besar (saldo/total): font-weight bold, ukuran 28-36px
- Judul section: font-weight semibold, 16-18px
- Label/keterangan kecil: 12-13px, warna abu

BENTUK & SPACING:
- Border-radius besar: 16-20px untuk card, 24px atau full-rounded untuk tombol utama
- Shadow lembut: 0 4px 12px rgba(0,0,0,0.08), hindari border keras
- Spacing antar card/section: 16-24px
- Padding dalam card: 16-20px
```

---

## 2. Prompt: Layout Halaman Login / Autentikasi

```
Redesain halaman login trakingduit.vercel.app dengan layout terinspirasi BRImo, tanpa mengubah struktur route/file yang sudah ada, hanya ubah tampilan komponen login:

STRUKTUR DARI ATAS KE BAWAH:
1. Background full-screen dengan gradasi biru (dari biru tua di atas ke biru lebih terang di bawah), atau bentuk lengkung dekoratif di pojok atas/bawah.
2. Logo/nama aplikasi "TrakingDuit" di bagian atas, center-aligned.
3. Teks sapaan besar: "Selamat Datang!" atau "Hai, Selamat Datang!" (bold, putih, ukuran besar).
4. (Opsional) Ilustrasi sederhana bertema keuangan/tabungan di tengah, atau icon besar dompet/grafik.
5. Card putih rounded (radius besar) yang "mengapung" di atas background, berisi:
   - Input "Email/Username" dengan icon di kiri
   - Input "Password" dengan icon gembok/mata (show/hide)
   - Link kecil "Lupa Password?" rata kanan
   - Tombol "Login" full-width, warna biru solid, rounded-full atau rounded-2xl
   - (Opsional) tombol login alternatif bulat kecil di samping (mis. Google/biometric)
6. Footer kecil: link "Daftar akun baru" di bagian bawah card.

Card login TIDAK menempel di ujung layar — beri jarak/margin agar terlihat seperti "melayang" di atas background gradasi, mirip pola BRImo.
```

---

## 3. Prompt: Layout Halaman Dashboard / Beranda

```
Redesain halaman dashboard utama (setelah login) trakingduit.vercel.app mengikuti pola BRImo, tanpa mengubah struktur data/komponen backend, hanya layout tampilan:

STRUKTUR DARI ATAS KE BAWAH:
1. Header dengan background biru gradasi (bisa hanya di bagian atas, melengkung di bawahnya), berisi:
   - Sapaan singkat / nama user (kiri)
   - Icon notifikasi (kanan)
2. Card "Total Saldo/Total Saku" besar, putih atau semi-transparan di atas header biru:
   - Label kecil "Total Saldo" / "Total Tabungan"
   - Nominal besar & bold
   - Icon kecil untuk toggle show/hide nominal (mata)
3. Card ringkasan anggaran (budget), bentuk donut/circular progress:
   - Persentase besar di tengah lingkaran (mis. "65% Pengeluaran")
   - Keterangan di sekitar: Total Anggaran, Anggaran Terpakai, Sisa Anggaran
4. Grid menu cepat (Quick Menu), 4 kolom x 2 baris:
   - Tiap item: icon berwarna dalam kotak rounded pastel + label teks kecil di bawahnya
   - Contoh untuk TrakingDuit: "Catat Transaksi", "Transfer", "Tabungan", "Top Up", "Tagihan", "Investasi", "Laporan", "Lainnya" (sesuaikan dengan fitur yang sudah ada di project)
5. Section "Transaksi Terakhir":
   - Judul section + link "Lihat Semua" di kanan
   - List transaksi dengan icon kategori (kiri), nama transaksi & tanggal (tengah), nominal (kanan, warna hijau untuk masuk / merah untuk keluar)
6. (Jika ada) Floating Action Button bulat warna oranye di pojok kanan bawah untuk "Tambah Transaksi".
7. Bottom navigation bar (mobile) dengan 4-5 icon utama: Beranda, Mutasi/Riwayat, tombol tambah (center, menonjol), Anggaran, Lainnya.
```

---

## 4. Prompt: Layout Halaman Daftar Akun/Kategori (mirip list rekening BRImo)

```
Buat/redesain halaman daftar akun keuangan (atau kategori tabungan/dompet) di trakingduit.vercel.app dengan pola card list ala BRImo:

STRUKTUR:
1. Card "Total Saldo Gabungan" di paling atas, full-width, dengan icon refresh kecil di kanan judul.
2. List card akun/dompet di bawahnya, tersusun vertikal, tiap card:
   - Background warna berbeda per akun (bisa gradasi custom per tipe akun: mis. biru untuk rekening, hijau untuk tabungan, abu/hitam untuk kartu kredit)
   - Kiri: label kecil ("MoCard"/nama bank atau nama dompet) + nama pemilik/kategori
   - Kanan atas: nomor akun/kartu (disamarkan sebagian)
   - Kanan bawah / pojok kanan: nominal saldo, bold
   - Radius besar, shadow lembut, sedikit efek "kartu fisik" (aspect ratio mirip kartu debit, atau bar horizontal ramping — sesuaikan kebutuhan)
3. Tombol "+ Tambah Akun Baru" full-width di bagian paling bawah, outline atau solid biru, rounded.
```

---

## 5. Prompt: Komponen Reusable (untuk dipakai di berbagai halaman)

```
Buat/perbarui komponen UI berikut di trakingduit.vercel.app (styling only, jangan ubah struktur file/props yang sudah ada kecuali perlu untuk styling):

1. BalanceCard — card saldo dengan label kecil, nominal besar bold, toggle show/hide, background gradasi biru atau putih dengan shadow.
2. BudgetProgressCircle — donut chart dengan persentase di tengah, warna progress biru/oranye tergantung status (aman/boros), 3 baris info di sekitarnya (Total, Terpakai, Sisa).
3. QuickMenuGrid — grid icon rounded pastel, 4 kolom, dengan label di bawah tiap icon, hover/tap state sedikit scale-down atau shadow naik.
4. TransactionListItem — baris transaksi: icon kategori bulat berwarna, nama + tanggal, nominal dengan warna hijau/merah sesuai jenis transaksi.
5. PrimaryButton — tombol rounded-full/rounded-2xl, warna solid biru gradasi, teks putih bold, full-width di form-form penting (login, tambah transaksi).
6. FloatingActionButton — tombol bulat oranye dengan icon "+", posisi fixed pojok kanan bawah atau menyatu di tengah bottom navigation.
```

---

## 6. Prompt: Adaptasi Mobile-first ke Web (Responsive)

```
Karena referensi BRImo adalah aplikasi mobile, adaptasikan layout tersebut agar tetap enak dilihat di layar web/desktop pada trakingduit.vercel.app:

- Mobile (<768px): ikuti layout BRImo apa adanya — single column, bottom navigation bar tetap terlihat, card penuh lebar layar dengan margin kecil.
- Tablet/Desktop (>=768px): 
  - Batasi lebar konten utama (max-width 480-560px) dan center-kan di tengah layar seperti tampilan "mobile app di browser", ATAU
  - Ubah bottom navigation menjadi sidebar navigation di kiri untuk layar besar, sementara card saldo, budget circle, dan quick menu tetap disusun dalam grid 2-3 kolom agar tidak terlalu sempit.
- Background gradasi biru pada login tetap full-screen di semua ukuran layar, dengan card login tetap center dan lebar maksimal 400px di desktop.
```

---

## Catatan
- Semua prompt di atas murni membahas **tampilan (UI)** — tidak menyentuh struktur folder, routing, atau logic project yang sudah ada di trakingduit.vercel.app.
- Sesuaikan nama fitur pada bagian Quick Menu & bottom navigation dengan fitur yang sebenarnya sudah ada di aplikasi (misal jika belum ada fitur "Top Up", ganti dengan fitur yang relevan).
- Warna oranye aksen bersifat opsional — bisa diganti warna aksen lain yang sesuai branding TrakingDuit selama kontras dengan biru utama tetap terjaga.
