-- =====================================================================
-- Karsa Pandiga - Migrasi 0009: jadwal pengantaran, kode pendek, produk unggulan
-- Jalankan SETELAH 0008. Di produksi: ekspor cadangan dulu.
-- =====================================================================

-- 1. Jadwal pengantaran yang terlihat pembeli. ---------------------------------------
alter table public.orders
  add column eta_date date,
  add column eta_note text check (eta_note is null or char_length(eta_note) <= 200),
  add column customer_note text check (customer_note is null or char_length(customer_note) <= 300),
  add column schedule_updated_at timestamptz;

-- 2. Kode pesanan pendek: "KP-" + 6 karakter tanpa 0, 1, I, O. Kode lama tetap valid. ---
create or replace function public.generate_order_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_bytes bytea;
  v_code text;
  v_index integer;
begin
  loop
    -- 12 karakter heksa pertama UUID v4 (6 byte) sepenuhnya acak.
    v_bytes := decode(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), 'hex');
    v_code := 'KP-';
    for v_index in 0..5 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_index) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.orders where order_code = v_code);
  end loop;
  return v_code;
end;
$$;

revoke all on function public.generate_order_code() from public, anon, authenticated;

alter table public.orders alter column order_code set default public.generate_order_code();

-- 3. Produk unggulan dipilih manual oleh admin. ----------------------------------------
alter table public.products add column is_featured boolean not null default false;
create index products_featured_idx on public.products (is_featured) where is_featured;

-- 4. Admin mengubah jadwal dan catatan untuk pembeli. -------------------------------------
create or replace function public.admin_update_schedule(
  p_order_id uuid,
  p_eta_date date,
  p_eta_note text,
  p_customer_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'order_not_found';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'order_already_final';
  end if;

  if p_eta_date is not null and (p_eta_date < v_today - 1 or p_eta_date > v_today + 120) then
    raise exception 'invalid_eta';
  end if;
  if char_length(coalesce(p_eta_note, '')) > 200 or char_length(coalesce(p_customer_note, '')) > 300 then
    raise exception 'note_too_long';
  end if;

  update public.orders
  set eta_date = p_eta_date,
      eta_note = nullif(btrim(coalesce(p_eta_note, '')), ''),
      customer_note = nullif(btrim(coalesce(p_customer_note, '')), ''),
      schedule_updated_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.admin_update_schedule(uuid, date, text, text) from public, anon, authenticated;
grant execute on function public.admin_update_schedule(uuid, date, text, text) to authenticated;

-- 5. Verifikasi pembayaran: sama seperti 0006, ditambah perkiraan jadwal awal. ---------------
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
  v_lead integer;
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

  select coalesce(max(p.lead_time_days), 0) into v_lead
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.order_id = v_order.id;

  update public.payments
  set verification_status = 'verified',
      verified_by = (select auth.uid()),
      verified_at = now()
  where id = p_payment_id;

  -- Perkiraan paling cepat diantar. Jadwal yang sudah diatur admin tidak ditimpa.
  update public.orders
  set status = 'processing',
      eta_date = coalesce(eta_date, (now() at time zone 'Asia/Jakarta')::date + greatest(v_lead, 1))
  where id = v_order.id;
end;
$$;

-- 6. Perubahan status: ada tahap "ready", dan boleh mundur di antara tahap lapangan. ---------
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
  if p_status not in ('processing', 'ready', 'delivering', 'completed', 'cancelled') then
    raise exception 'status_not_allowed';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'order_not_found';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'order_already_final';
  end if;
  if v_order.status = p_status then
    raise exception 'invalid_transition';
  end if;

  -- Tahap lapangan hanya setelah pembayaran terverifikasi.
  if p_status <> 'cancelled' and v_order.status in ('awaiting_payment', 'awaiting_verification') then
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

-- 7. track_order: tambah jadwal dan catatan untuk pembeli. -------------------------------
create or replace function public.track_order(p_order_code text, p_phone text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code text := upper(btrim(coalesce(p_order_code, '')));
  v_ip text := public.client_ip();
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_items jsonb;
begin
  perform public.assert_track_allowed(v_code, v_ip);

  select * into v_order from public.orders where order_code = v_code;

  if v_order.id is null or v_order.customer_phone <> public.normalize_phone(p_phone) then
    perform public.record_failed_attempt(v_code, v_ip, v_order.id is not null);
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
    'delivery_address', v_order.delivery_address,
    'shipping_zone_name', v_order.shipping_zone_name,
    'notes', v_order.notes,
    'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'total', v_order.total,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'eta_date', v_order.eta_date,
    'eta_note', v_order.eta_note,
    'customer_note', v_order.customer_note,
    'schedule_updated_at', v_order.schedule_updated_at,
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