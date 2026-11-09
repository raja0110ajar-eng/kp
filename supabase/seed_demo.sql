-- Data contoh untuk uji alur beli. Aman dijalankan ulang. Ganti/hapus sebelum dipakai sungguhan.

insert into public.products (slug, name, description, price, stock, product_type) values
  (
    'gantungan-kunci-anyaman',
    'Gantungan Kunci Anyaman Daur Ulang',
    'Gantungan kunci dari anyaman plastik daur ulang buatan kelompok kami. Warna dikirim acak.',
    8000, 25, 'own_product'
  ),
  (
    'pot-mini-semen',
    'Pot Mini Semen Kreatif',
    'Pot mini dari semen dengan cetakan buatan sendiri, cocok untuk kaktus atau sukulen.',
    15000, 12, 'own_product'
  ),
  (
    'keripik-singkong-balado',
    'Keripik Singkong Balado 100 g',
    'Keripik singkong rasa balado dari reseller mitra. Kemasan 100 gram.',
    12000, 30, 'reseller'
  )
on conflict (slug) do nothing;

insert into public.product_costs (product_id, reseller_name, cost_price)
select id, 'Reseller Contoh (ganti)', 9000
from public.products
where slug = 'keripik-singkong-balado'
on conflict (product_id) do nothing;

insert into public.shipping_zones (name, fee, sort_order) values
  ('Zona A - dekat sekolah (contoh)', 5000, 1),
  ('Zona B - agak jauh (contoh)', 10000, 2)
on conflict (name) do nothing;

-- QRIS sengaja nonaktif: aktifkan setelah gambar QRIS diunggah ke bucket public-assets
-- dan kolom qris_image_path terisi (constraint database menolak jika belum).
insert into public.payment_settings
  (method, is_active, display_name, account_name, account_number, instructions, qris_image_path, sort_order)
values
  ('qris', false, 'QRIS', null, null,
   'Scan QRIS, masukkan nominal sesuai total pesanan, lalu unggah screenshot bukti.', null, 1),
  ('dana', true, 'DANA', 'Karsa Pandiga (contoh fiktif)', '081200000000',
   'Transfer sesuai total pesanan, lalu unggah screenshot bukti.', null, 2),
  ('ovo', true, 'OVO', 'Karsa Pandiga (contoh fiktif)', '081200000001',
   'Transfer sesuai total pesanan, lalu unggah screenshot bukti.', null, 3),
  ('gopay', true, 'GoPay', 'Karsa Pandiga (contoh fiktif)', '081200000002',
   'Transfer sesuai total pesanan, lalu unggah screenshot bukti.', null, 4),
  ('bank_transfer', true, 'Bank Contoh', 'Karsa Pandiga (contoh fiktif)', '0000000000',
   'Transfer sesuai total pesanan (tanpa pembulatan), lalu unggah screenshot bukti.', null, 5)
on conflict (method) do nothing;