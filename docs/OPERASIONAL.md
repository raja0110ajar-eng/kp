# Panduan operasional Karsa Pandiga

Untuk admin dan anggota kelompok yang mengelola situs yang sudah tayang.

## 1. Gambaran layanan dan batas gratisnya

| Layanan | Fungsi | Batas yang perlu diperhatikan |
|---|---|---|
| Vercel (Hobby) | Hosting situs | Hanya untuk penggunaan pribadi non-komersial. Cron maksimal sekali sehari. Satu region fungsi. |
| Supabase (Free) | Database, login, penyimpanan | 500 MB database, 1 GB file, 5 GB egress per bulan. Proyek **dijeda otomatis setelah 7 hari tanpa aktivitas**. **Tidak ada cadangan otomatis.** Maksimal 2 proyek gratis aktif. |

Cek angka terbaru di halaman harga masing-masing penyedia karena bisa berubah.

## 2. Peringatan: ketentuan Vercel Hobby

Situs ini menerima pesanan dan pembayaran dari pembeli umum. Ketentuan Vercel menyebut paket Hobby
hanya untuk penggunaan pribadi non-komersial, dan penggunaan komersial membutuhkan paket Pro.
Kelompok memilih tetap di Hobby dengan sadar akan risikonya: akun atau proyek bisa dijeda bila
dianggap melanggar. Langkah yang disarankan:

- Tanyakan ke dukungan Vercel apakah proyek siswa seperti ini boleh di Hobby, dan simpan jawabannya.
- Siapkan rencana pindah: kode ini Next.js standar, bisa dipasang di hosting lain. Database dan
  penyimpanan ada di Supabase sehingga tidak ikut berpindah.
- Simpan cadangan data secara rutin (bagian 8).

## 3. Rutinitas

Harian: buka **Dashboard admin → Verifikasi**, periksa pembayaran yang menunggu, lalu proses pesanan
(diantar, selesai). Balas pembeli lewat WhatsApp bila perlu.

Mingguan: ekspor cadangan (bagian 8), cek stok menipis di Ringkasan, dan cek pemakaian penyimpanan di
Supabase (Storage dan Database).

Bulanan: hapus data pesanan yang melewati masa simpan (bagian 9).

## 4. Menambah atau mencabut admin

Admin hanya bisa diubah lewat SQL (Supabase → SQL Editor), tidak lewat situs.

Tambah (akun harus sudah terdaftar):

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'email-anggota@gmail.com'
on conflict (user_id) do nothing;
```

Cabut:

```sql
delete from public.admin_users
where user_id = (select id from auth.users where email = 'email-anggota@gmail.com');
```

Daftar admin saat ini:

```sql
select u.email, a.created_at
from public.admin_users a
join auth.users u on u.id = a.user_id;
```

Daftarkan akun anggota baru lewat Supabase → Authentication → Users → Add user (kata sandi unik dan kuat),
bukan lewat halaman daftar publik, agar tidak ada orang lain yang mendaftar duluan dengan email itu.

## 5. Mengganti tarif, QRIS, rekening, dan produk

Semuanya lewat dashboard admin: **Tarif kurir**, **Setelan bayar**, dan **Produk**. Perubahan langsung
berlaku di checkout. Metode pembayaran tidak bisa diaktifkan sebelum nomor atau gambar QRIS terisi.

## 6. Menangani masalah pesanan

- **Bukti buram atau nominal beda:** tolak dengan alasan cepat. Pembeli melihat catatanmu dan bisa
  mengunggah ulang. Maksimal 5 berkas unggahan per pesanan. Kalau batas tercapai, hapus berkas lama di
  Supabase → Storage → payment-proofs → folder pesanan itu.
- **Stok tidak cukup saat verifikasi:** tambah stok produk di dashboard, lalu verifikasi ulang.
- **Salah verifikasi:** batalkan pesanannya (stok otomatis kembali), lalu minta pembeli memesan ulang.
- **COD:** konfirmasi di antrean (tab COD). Stok berkurang saat dikonfirmasi, bukan saat uang diterima.

## 7. Pelacakan pembeli terkunci

Pembeli yang salah memasukkan nomor HP lima kali terkunci 15 menit. Untuk membukanya, jalankan di
SQL Editor dengan kode pesanannya:

```sql
delete from public.track_attempts where scope = 'code' and key = 'KP-XXXXXXXXXX';
```

Ganti `KP-XXXXXXXXXX` dengan kode pesanan pembeli. Batas pembuatan pesanan (10 per jam per jaringan)
dibuka dengan `scope = 'order'` dan `key` berisi alamat IP-nya.

## 8. Cadangan mingguan (manual)

Paket gratis Supabase tidak punya cadangan otomatis, jadi data bisa hilang permanen bila terjadi
kesalahan. Tiap minggu:

1. Supabase → Table Editor, ekspor sebagai CSV tabel: `orders`, `order_items`, `payments`, `products`,
   `product_costs`, `shipping_zones`, `payment_settings`.
2. Simpan di tempat yang aman dan terpisah dari komputer utama (mis. drive kelompok), beri tanggal pada
   nama file.
3. Berkas bukti transfer tidak ikut terekspor. Unduh manual dari Storage bila perlu menyimpannya.

Opsi lanjutan: `pg_dump` dengan connection string dari dashboard. Connection string berisi kata sandi
database, jadi jangan pernah disimpan di repositori.

## 9. Penghapusan data setelah 12 bulan

Sesuai kebijakan privasi, data pesanan disimpan sekitar 12 bulan. Daftar pesanan yang sudah lewat:

```sql
select o.order_code, o.created_at, p.proof_path
from public.orders o
join public.payments p on p.order_id = o.id
where o.created_at < now() - interval '12 months'
  and o.status in ('completed', 'cancelled')
order by o.created_at;
```

1. Hapus berkas bukti transfernya lewat **Storage di dashboard** (jangan lewat SQL, karena file di
   penyimpanan bisa tetap tertinggal).
2. Setelah berkas terhapus, hapus pesanannya:

```sql
delete from public.orders
where created_at < now() - interval '12 months'
  and status in ('completed', 'cancelled');
```

Item pesanan dan pembayaran ikut terhapus otomatis.

## 10. Pemecahan masalah

| Gejala | Kemungkinan penyebab dan solusi |
|---|---|
| Situs menampilkan error database | Proyek Supabase mungkin dijeda. Buka dashboard Supabase dan klik pulihkan (Restore). |
| Gambar produk tidak muncul | Cek `NEXT_PUBLIC_SUPABASE_URL` di Vercel dan pastikan `image_path` terisi. Setelah mengubah env, deploy ulang. |
| Login admin gagal | Pastikan akun terdaftar dan ada di daftar admin (bagian 4). Cek URL Auth di Supabase. |
| OCR lambat saat pertama | Data bahasa diunduh dari CDN. Wajar, lalu tersimpan di cache browser. |
| Halaman lambat | Cek region fungsi di Vercel (Settings → Functions) harus dekat dengan Supabase (Singapura). |
| Perubahan env tidak berlaku | Variabel `NEXT_PUBLIC_*` tertanam saat build. Lakukan Redeploy. |

## 11. Bila kamu menambah fitur yang mengumpulkan data

Misalnya analitik pengunjung atau formulir baru: perbarui halaman `/privasi` (`src/app/(public)/privasi/page.tsx`)
agar sesuai dengan data yang benar-benar dikumpulkan.

## 12. Mengembalikan deploy yang bermasalah

Di Vercel → Deployments, pilih deploy sebelumnya yang sehat lalu jadikan versi produksi. Perubahan
database (migrasi) hanya maju dan tidak ikut mundur, jadi sebelum menjalankan migrasi baru selalu ekspor
data terlebih dahulu (bagian 8).