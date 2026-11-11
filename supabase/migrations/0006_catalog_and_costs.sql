-- =====================================================================
-- Karsa Pandiga - Migrasi 0006: kategori, detail produk, biaya produksi
-- Jalankan di proyek UJI dulu. Di produksi: ekspor cadangan dulu.
-- =====================================================================

-- 1. Kategori (nama bisa diubah admin lewat dashboard).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name text not null unique check (char_length(name) between 1 and 60),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy categories_select_public on public.categories
  for select to anon, authenticated
  using (is_active);
create policy categories_admin_all on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.categories (name, slug, sort_order) values
  ('Teknologi', 'teknologi', 1),
  ('Fashion daur ulang', 'fashion-daur-ulang', 2),
  ('Kertas benih', 'kertas-benih', 3),
  ('Makanan dan lainnya', 'makanan-dan-lainnya', 4)
on conflict (slug) do nothing;

-- 2. Detail produk: kategori, galeri (maks. 3 foto tambahan), bahan, ukuran, berat, estimasi pengerjaan.
alter table public.products
  add column category_id uuid references public.categories (id) on delete set null,
  add column gallery_paths text[] not null default '{}' check (cardinality(gallery_paths) <= 3),
  add column materials text check (materials is null or char_length(materials) <= 200),
  add column dimensions text check (dimensions is null or char_length(dimensions) <= 100),
  add column weight_grams integer check (weight_grams is null or weight_grams between 1 and 100000),
  add column lead_time_days integer not null default 0 check (lead_time_days between 0 and 60);

create index products_category_idx on public.products (category_id);

-- 3. Biaya produksi per unit: cost_price = bahan/harga beli, ditambah kemasan dan menit tenaga.
alter table public.product_costs
  add column packaging_cost integer not null default 0 check (packaging_cost >= 0),
  add column labor_minutes integer not null default 0 check (labor_minutes between 0 and 6000);

-- 4. Asumsi biaya usaha (satu baris). Diisi admin di halaman Laporan.
create table public.business_settings (
  id boolean primary key default true check (id),
  labor_rate_per_hour integer not null default 0 check (labor_rate_per_hour between 0 and 1000000),
  delivery_cost_school integer not null default 0 check (delivery_cost_school between 0 and 1000000),
  delivery_cost_outside integer not null default 0 check (delivery_cost_outside between 0 and 1000000),
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (true) on conflict (id) do nothing;

create trigger business_settings_set_updated_at before update on public.business_settings
  for each row execute function public.set_updated_at();

alter table public.business_settings enable row level security;
create policy business_settings_admin_all on public.business_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5. HPP per unit yang tersimpan di item pesanan (diisi saat pembayaran diverifikasi).
alter table public.order_items
  add column unit_cost integer check (unit_cost is null or unit_cost >= 0);

-- HPP per unit = bahan + kemasan + (menit tenaga x tarif per jam / 60). Null bila bahan belum diisi.
create or replace function public.product_unit_cost(p_product_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when pc.cost_price is null then null
    else pc.cost_price + pc.packaging_cost
         + round((pc.labor_minutes::bigint * bs.labor_rate_per_hour) / 60.0)::integer
  end
  from public.product_costs pc
  cross join public.business_settings bs
  where pc.product_id = p_product_id;
$$;

revoke all on function public.product_unit_cost(uuid) from public, anon, authenticated;

-- 6. Verifikasi pembayaran: sama seperti sebelumnya, ditambah snapshot HPP.
create or replace function public.admin_verify_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_item record;
  v_updated integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then
    raise exception 'payment_not_found';
  end if;
  if v_payment.verification_status <> 'awaiting_review' then
    raise exception 'payment_not_awaiting_review';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;
  if v_order.status = 'cancelled' then
    raise exception 'order_cancelled';
  end if;

  for v_item in
    select product_id, product_name, quantity
    from public.order_items
    where order_id = v_order.id
    order by product_id
  loop
    update public.products
    set stock = stock - v_item.quantity
    where id = v_item.product_id and stock >= v_item.quantity;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'insufficient_stock: %', v_item.product_name;
    end if;
  end loop;

  -- Snapshot HPP agar laporan laba tidak berubah bila biaya produk diedit kemudian.
  update public.order_items
  set unit_cost = public.product_unit_cost(product_id)
  where order_id = v_order.id;

  update public.payments
  set verification_status = 'verified',
      verified_by = (select auth.uid()),
      verified_at = now()
  where id = p_payment_id;

  update public.orders set status = 'processing' where id = v_order.id;
end;
$$;