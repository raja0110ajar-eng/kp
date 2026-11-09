-- =====================================================================
-- Karsa Pandiga - Migrasi 0001: skema awal
-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- =====================================================================

-- 1. ENUM --------------------------------------------------------------
create type public.product_type as enum ('own_product', 'reseller');
create type public.delivery_area as enum ('school', 'outside');
create type public.payment_method as enum ('cod', 'qris', 'dana', 'ovo', 'gopay', 'bank_transfer');
create type public.order_status as enum (
  'awaiting_payment', 'awaiting_verification', 'processing', 'delivering', 'completed', 'cancelled'
);
create type public.ai_status as enum ('not_applicable', 'pending', 'matched', 'mismatch', 'unreadable');
create type public.verification_status as enum ('awaiting_proof', 'awaiting_review', 'verified', 'rejected');

-- 2. FUNGSI UTILITAS ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Menyeragamkan nomor HP: "+62 812-3456-7890" dan "0812 3456 7890" menjadi "081234567890".
create or replace function public.normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d.digits like '62%' then '0' || substr(d.digits, 3)
    else d.digits
  end
  from (select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as digits) as d;
$$;

-- 3. TABEL -------------------------------------------------------------
-- Admin ditambah lewat SQL (supabase/seed_admins.sql), BUKAN lewat web.
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  product_type public.product_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Data internal (hanya admin): nama reseller dan harga modal.
create table public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  reseller_name text check (reseller_name is null or char_length(reseller_name) between 1 and 120),
  cost_price integer check (cost_price is null or cost_price >= 0)
);

-- Tarif kurir luar sekolah per zona. Area sekolah selalu ongkir 0 (tanpa zona).
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  fee integer not null check (fee >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique
    default ('KP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid references auth.users (id) on delete set null, -- null = guest checkout
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  customer_phone text not null check (customer_phone ~ '^08[0-9]{8,11}$'),
  delivery_area public.delivery_area not null,
  shipping_zone_id uuid references public.shipping_zones (id) on delete restrict,
  shipping_zone_name text,
  delivery_address text not null check (char_length(delivery_address) between 1 and 300),
  notes text check (notes is null or char_length(notes) <= 300),
  subtotal integer not null check (subtotal >= 0),
  shipping_fee integer not null check (shipping_fee >= 0),
  total integer not null check (total = subtotal + shipping_fee),
  status public.order_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_area_zone_chk check (
    (delivery_area = 'school' and shipping_zone_id is null)
    or (delivery_area = 'outside' and shipping_zone_id is not null)
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,        -- snapshot saat checkout
  unit_price integer not null check (unit_price >= 0), -- snapshot saat checkout
  quantity integer not null check (quantity between 1 and 99),
  line_total integer not null check (line_total = unit_price * quantity)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  method public.payment_method not null,
  expected_amount integer not null check (expected_amount >= 0),
  proof_path text,
  ocr_raw_text text check (ocr_raw_text is null or char_length(ocr_raw_text) <= 4000),
  ocr_detected_amounts integer[] not null default '{}',
  ocr_matched_amount integer,
  ocr_confidence numeric(5, 2) check (ocr_confidence is null or ocr_confidence between 0 and 100),
  ai_status public.ai_status not null,
  ai_checked_at timestamptz,
  verification_status public.verification_status not null,
  admin_note text,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_cod_ai_chk check (
    (method = 'cod' and ai_status = 'not_applicable')
    or (method <> 'cod' and ai_status <> 'not_applicable')
  )
);

-- 4. INDEX -------------------------------------------------------------
create index orders_user_id_idx on public.orders (user_id) where user_id is not null;
create index orders_status_created_idx on public.orders (status, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index payments_verification_idx on public.payments (verification_status);
create index products_active_idx on public.products (is_active, created_at desc);

-- 5. TRIGGER updated_at ------------------------------------------------
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- 6. ROW LEVEL SECURITY ------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_costs enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- admin_users: hanya bisa melihat baris sendiri. Tidak ada policy insert/update/delete,
-- jadi penambahan admin hanya bisa lewat SQL Editor.
create policy admin_users_select_self on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));

-- products: publik hanya melihat produk aktif; admin penuh.
create policy products_select_public on public.products
  for select to anon, authenticated
  using (is_active);
create policy products_admin_all on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- product_costs: admin saja.
create policy product_costs_admin_all on public.product_costs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- shipping_zones: publik melihat zona aktif (untuk checkout); admin penuh.
create policy shipping_zones_select_public on public.shipping_zones
  for select to anon, authenticated
  using (is_active);
create policy shipping_zones_admin_all on public.shipping_zones
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- orders, order_items, payments:
--  * TIDAK ADA policy insert/update/delete: semua penulisan lewat fungsi RPC (security definer).
--  * Pembeli login boleh membaca pesanannya sendiri; admin membaca semua.
--  * Guest membaca lewat fungsi track_order (kode pesanan + nomor HP).
create policy orders_select_own on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy orders_select_admin on public.orders
  for select to authenticated
  using (public.is_admin());

create policy order_items_select_own on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));
create policy order_items_select_admin on public.order_items
  for select to authenticated
  using (public.is_admin());

create policy payments_select_own on public.payments
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = payments.order_id and o.user_id = (select auth.uid())
  ));
create policy payments_select_admin on public.payments
  for select to authenticated
  using (public.is_admin());

-- 7. RPC PUBLIK (guest + login) ---------------------------------------
create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_area public.delivery_area,
  p_shipping_zone_id uuid,
  p_delivery_address text,
  p_payment_method public.payment_method,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone(p_customer_phone);
  v_zone public.shipping_zones%rowtype;
  v_product public.products%rowtype;
  v_item jsonb;
  v_qty integer;
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_total integer;
  v_item_count integer;
  v_order_id uuid;
  v_order_code text;
  v_payment_id uuid;
begin
  if v_phone !~ '^08[0-9]{8,11}$' then
    raise exception 'invalid_phone';
  end if;
  if char_length(btrim(coalesce(p_customer_name, ''))) = 0 then
    raise exception 'invalid_name';
  end if;
  if char_length(btrim(coalesce(p_delivery_address, ''))) = 0 then
    raise exception 'invalid_address';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_items';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 50 then
    raise exception 'invalid_items';
  end if;
  if (select count(distinct e.value ->> 'product_id') from jsonb_array_elements(p_items) as e) <> v_item_count then
    raise exception 'duplicate_items';
  end if;

  -- Pass 1: validasi produk + stok, hitung subtotal dari harga di database.
  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_qty := (v_item ->> 'quantity')::integer;
      select * into v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid and is_active
      for share;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'invalid_items';
    end;

    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception 'invalid_items';
    end if;
    if v_product.id is null then
      raise exception 'product_unavailable';
    end if;
    if v_product.stock < v_qty then
      raise exception 'insufficient_stock: %', v_product.name;
    end if;

    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  -- Ongkir: area sekolah = 0; area luar = tarif zona aktif dari database.
  if p_delivery_area = 'outside' then
    select * into v_zone
    from public.shipping_zones
    where id = p_shipping_zone_id and is_active;
    if v_zone.id is null then
      raise exception 'invalid_zone';
    end if;
    v_shipping := v_zone.fee;
  end if;

  v_total := v_subtotal + v_shipping;

  insert into public.orders (
    user_id, customer_name, customer_phone, delivery_area,
    shipping_zone_id, shipping_zone_name, delivery_address, notes,
    subtotal, shipping_fee, total, status
  ) values (
    (select auth.uid()),
    btrim(p_customer_name),
    v_phone,
    p_delivery_area,
    case when p_delivery_area = 'outside' then v_zone.id else null end,
    case when p_delivery_area = 'outside' then v_zone.name else null end,
    btrim(p_delivery_address),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_subtotal,
    v_shipping,
    v_total,
    (case when p_payment_method = 'cod' then 'awaiting_verification' else 'awaiting_payment' end)::public.order_status
  )
  returning id, order_code into v_order_id, v_order_code;

  -- Pass 2: simpan item dengan snapshot nama + harga (baris produk masih terkunci "for share").
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);
  end loop;

  insert into public.payments (order_id, method, expected_amount, ai_status, verification_status)
  values (
    v_order_id,
    p_payment_method,
    v_total,
    (case when p_payment_method = 'cod' then 'not_applicable' else 'pending' end)::public.ai_status,
    (case when p_payment_method = 'cod' then 'awaiting_review' else 'awaiting_proof' end)::public.verification_status
  )
  returning id into v_payment_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'total', v_total,
    'payment_method', p_payment_method
  );
end;
$$;

-- Guest melacak pesanan dengan kode pesanan + nomor HP.
create or replace function public.track_order(p_order_code text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_items jsonb;
begin
  select * into v_order
  from public.orders
  where order_code = upper(btrim(p_order_code))
    and customer_phone = public.normalize_phone(p_phone);

  if v_order.id is null then
    return null;
  end if;

  select * into v_payment from public.payments where order_id = v_order.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_name', product_name,
        'unit_price', unit_price,
        'quantity', quantity,
        'line_total', line_total
      ) order by product_name
    ),
    '[]'::jsonb
  )
  into v_items
  from public.order_items
  where order_id = v_order.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'status', v_order.status,
    'delivery_area', v_order.delivery_area,
    'customer_name', v_order.customer_name,
    'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'total', v_order.total,
    'created_at', v_order.created_at,
    'items', v_items,
    'payment', jsonb_build_object(
      'id', v_payment.id,
      'method', v_payment.method,
      'expected_amount', v_payment.expected_amount,
      'ai_status', v_payment.ai_status,
      'verification_status', v_payment.verification_status,
      'admin_note', v_payment.admin_note
    )
  );
end;
$$;

-- Pembeli mengirim hasil OCR + path bukti yang sudah diupload ke Storage.
-- Server tetap memeriksa konsistensi: "matched" hanya sah jika nominal == total pesanan.
create or replace function public.submit_payment_proof(
  p_order_code text,
  p_phone text,
  p_proof_path text,
  p_ocr_raw_text text,
  p_detected_amounts integer[],
  p_matched_amount integer,
  p_confidence numeric,
  p_ai_status public.ai_status
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_final_ai public.ai_status;
begin
  select * into v_order
  from public.orders
  where order_code = upper(btrim(p_order_code))
    and (
      customer_phone = public.normalize_phone(p_phone)
      or (user_id is not null and user_id = (select auth.uid()))
    );
  if v_order.id is null then
    raise exception 'order_not_found';
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'order_cancelled';
  end if;

  select * into v_payment from public.payments where order_id = v_order.id for update;
  if v_payment.method = 'cod' then
    raise exception 'payment_is_cod';
  end if;
  if v_payment.verification_status not in ('awaiting_proof', 'awaiting_review', 'rejected') then
    raise exception 'payment_locked';
  end if;

  if p_ai_status not in ('matched', 'mismatch', 'unreadable') then
    raise exception 'invalid_ai_status';
  end if;
  if p_proof_path !~ ('^' || v_order.id::text || '/[0-9a-f-]{36}\.jpg$') then
    raise exception 'invalid_proof_path';
  end if;
  if not exists (
    select 1 from storage.objects where bucket_id = 'payment-proofs' and name = p_proof_path
  ) then
    raise exception 'proof_not_uploaded';
  end if;

  v_final_ai := case
    when p_ai_status = 'matched' and p_matched_amount = v_payment.expected_amount then 'matched'
    when p_ai_status = 'matched' then 'mismatch'
    else p_ai_status
  end;

  update public.payments
  set proof_path = p_proof_path,
      ocr_raw_text = left(coalesce(p_ocr_raw_text, ''), 4000),
      ocr_detected_amounts = coalesce(p_detected_amounts[1:50], '{}'),
      ocr_matched_amount = case when v_final_ai = 'matched' then p_matched_amount else null end,
      ocr_confidence = least(greatest(coalesce(p_confidence, 0), 0), 100),
      ai_status = v_final_ai,
      ai_checked_at = now(),
      verification_status = 'awaiting_review',
      admin_note = null
  where id = v_payment.id;

  update public.orders set status = 'awaiting_verification' where id = v_order.id;

  return jsonb_build_object('ai_status', v_final_ai, 'verification_status', 'awaiting_review');
end;
$$;

-- 8. RPC ADMIN ---------------------------------------------------------
-- Verifikasi pembayaran. Stok berkurang DI SINI (keputusan 7B).
-- Untuk COD, fungsi yang sama dipakai sebagai "konfirmasi pesanan" oleh admin.
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

  update public.payments
  set verification_status = 'verified',
      verified_by = (select auth.uid()),
      verified_at = now()
  where id = p_payment_id;

  update public.orders set status = 'processing' where id = v_order.id;
end;
$$;

create or replace function public.admin_reject_payment(p_payment_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if char_length(btrim(coalesce(p_note, ''))) = 0 then
    raise exception 'note_required';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then
    raise exception 'payment_not_found';
  end if;
  if v_payment.verification_status <> 'awaiting_review' then
    raise exception 'payment_not_awaiting_review';
  end if;

  update public.payments
  set verification_status = 'rejected',
      admin_note = btrim(p_note),
      verified_by = (select auth.uid()),
      verified_at = now()
  where id = p_payment_id;

  -- COD yang ditolak = pesanan dibatalkan. Non-COD ditolak = pembeli boleh upload ulang.
  update public.orders
  set status = (case when v_payment.method = 'cod' then 'cancelled' else 'awaiting_payment' end)::public.order_status
  where id = v_payment.order_id;
end;
$$;

-- Admin mengubah status pesanan. Pembatalan setelah terverifikasi mengembalikan stok.
create or replace function public.admin_set_order_status(p_order_id uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('delivering', 'completed', 'cancelled') then
    raise exception 'status_not_allowed';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'order_not_found';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'order_already_final';
  end if;
  if p_status = 'delivering' and v_order.status <> 'processing' then
    raise exception 'invalid_transition';
  end if;
  if p_status = 'completed' and v_order.status not in ('processing', 'delivering') then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'cancelled' and exists (
    select 1 from public.payments where order_id = v_order.id and verification_status = 'verified'
  ) then
    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = v_order.id and p.id = oi.product_id;
  end if;

  update public.orders set status = p_status where id = v_order.id;
end;
$$;

-- 9. HAK EKSEKUSI FUNGSI -----------------------------------------------
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.normalize_phone(text) from public, anon, authenticated;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

revoke all on function public.create_order(text, text, public.delivery_area, uuid, text, public.payment_method, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_order(text, text, public.delivery_area, uuid, text, public.payment_method, text, jsonb)
  to anon, authenticated;

revoke all on function public.track_order(text, text) from public, anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;

revoke all on function public.submit_payment_proof(text, text, text, text, integer[], integer, numeric, public.ai_status)
  from public, anon, authenticated;
grant execute on function public.submit_payment_proof(text, text, text, text, integer[], integer, numeric, public.ai_status)
  to anon, authenticated;

revoke all on function public.admin_verify_payment(uuid) from public, anon, authenticated;
grant execute on function public.admin_verify_payment(uuid) to authenticated;

revoke all on function public.admin_reject_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_reject_payment(uuid, text) to authenticated;

revoke all on function public.admin_set_order_status(uuid, public.order_status) from public, anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, public.order_status) to authenticated;

-- 10. STORAGE: bucket privat untuk bukti transfer -----------------------
-- Batas 2 MB dan hanya JPEG (klien selalu mengompres ke JPEG sebelum upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

-- Siapa pun boleh MENGUNGGAH (tanpa baca) dengan pola nama {order_id}/{uuid}.jpg.
create policy payment_proofs_insert_public on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
  );

-- Hanya admin yang boleh melihat dan menghapus bukti.
create policy payment_proofs_select_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

create policy payment_proofs_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());