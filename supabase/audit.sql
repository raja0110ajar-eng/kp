-- =====================================================================
-- Karsa Pandiga - Audit keamanan (hanya membaca). Jalankan per bagian di SQL Editor.
-- =====================================================================

-- 1. Tabel di schema public yang RLS-nya MATI. HASIL YANG BENAR: kosong.
select tablename as tabel_tanpa_rls
from pg_tables
where schemaname = 'public' and not rowsecurity
order by 1;

-- 2. Semua policy. Periksa peran dan perintahnya satu per satu.
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 3. Fungsi di schema public yang bisa dijalankan peran anonim.
-- HASIL YANG BENAR (hanya lima): can_upload_proof, create_order, is_admin,
-- submit_payment_proof, track_order. Fungsi admin_* dan fungsi bantu TIDAK boleh muncul.
select p.proname as fungsi, pg_get_function_identity_arguments(p.oid) as argumen
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and has_function_privilege('anon', p.oid, 'execute')
order by 1;

-- 4. Bucket Storage.
-- HASIL YANG BENAR: payment-proofs public = false; public-assets public = true.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

-- 5. Uji sebagai pengunjung anonim. HASIL YANG BENAR: semua baris bernilai 0.
-- Catatan: jalankan SETELAH ada minimal satu pesanan uji, kalau tidak hasilnya 0 untuk alasan yang salah.
begin;
set local role anon;
select 'orders' as tabel, count(*) as baris_terlihat from public.orders
union all select 'order_items', count(*) from public.order_items
union all select 'payments', count(*) from public.payments
union all select 'product_costs', count(*) from public.product_costs
union all select 'admin_users', count(*) from public.admin_users
union all select 'produk nonaktif', count(*) from public.products where not is_active
union all select 'setelan bayar nonaktif', count(*) from public.payment_settings where not is_active;
rollback;