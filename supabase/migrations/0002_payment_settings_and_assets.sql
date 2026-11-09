-- =====================================================================
-- Karsa Pandiga - Migrasi 0002: setelan pembayaran + aset publik
-- Jalankan sekali di Supabase Dashboard > SQL Editor (setelah 0001).
-- =====================================================================

-- 1. Gambar produk disimpan sebagai PATH di bucket public-assets (bukan URL penuh).
alter table public.products rename column image_url to image_path;

-- 2. Tujuan pembayaran per metode (COD tidak perlu: tidak ada tujuan transfer).
create table public.payment_settings (
  method public.payment_method primary key check (method <> 'cod'),
  is_active boolean not null default false,
  display_name text not null check (char_length(display_name) between 1 and 60),
  account_name text check (account_name is null or char_length(account_name) between 1 and 100),
  account_number text check (account_number is null or char_length(account_number) between 1 and 60),
  instructions text not null default '' check (char_length(instructions) <= 500),
  qris_image_path text check (qris_image_path is null or char_length(qris_image_path) <= 200),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  -- Metode tidak boleh aktif sebelum datanya lengkap.
  constraint payment_settings_complete_when_active check (
    not is_active
    or (method = 'qris' and qris_image_path is not null)
    or (method <> 'qris' and account_number is not null)
  )
);

create trigger payment_settings_set_updated_at before update on public.payment_settings
  for each row execute function public.set_updated_at();

alter table public.payment_settings enable row level security;

-- Publik hanya melihat metode aktif (pembeli perlu tahu tujuan transfer). Admin penuh.
create policy payment_settings_select_public on public.payment_settings
  for select to anon, authenticated
  using (is_active);
create policy payment_settings_admin_all on public.payment_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Pesanan non-COD hanya boleh memakai metode yang aktif di payment_settings.
create or replace function public.enforce_active_payment_method()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.method <> 'cod' and not exists (
    select 1 from public.payment_settings
    where method = new.method and is_active
  ) then
    raise exception 'payment_method_unavailable';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_active_payment_method() from public, anon, authenticated;

create trigger payments_enforce_method before insert on public.payments
  for each row execute function public.enforce_active_payment_method();

-- 4. Bucket PUBLIK untuk gambar produk dan gambar QRIS (maks 2 MB; JPEG/PNG/WebP).
-- File di bucket publik bisa dibuka lewat URL tanpa policy. Hanya admin yang boleh mengelola isinya.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-assets', 'public-assets', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy public_assets_select_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'public-assets' and public.is_admin());

create policy public_assets_insert_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'public-assets' and public.is_admin());

create policy public_assets_update_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'public-assets' and public.is_admin())
  with check (bucket_id = 'public-assets' and public.is_admin());

create policy public_assets_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'public-assets' and public.is_admin());