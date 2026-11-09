-- =====================================================================
-- Karsa Pandiga - Migrasi 0004: pembatasan percobaan pelacakan guest
-- Jalankan sekali di Supabase Dashboard > SQL Editor (setelah 0003).
-- =====================================================================

-- 1. Tabel percobaan gagal. RLS aktif tanpa policy: hanya fungsi database yang bisa mengaksesnya.
create table public.track_attempts (
  id bigint generated always as identity primary key,
  scope text not null check (scope in ('code', 'ip')),
  key text not null check (char_length(key) between 1 and 64),
  created_at timestamptz not null default now()
);

create index track_attempts_lookup_idx on public.track_attempts (scope, key, created_at desc);
create index track_attempts_created_idx on public.track_attempts (created_at);

alter table public.track_attempts enable row level security;
revoke all on public.track_attempts from anon, authenticated;

-- 2. IP klien dari header permintaan (cf-connecting-ip diisi platform Supabase).
create or replace function public.client_ip()
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_raw text := nullif(current_setting('request.headers', true), '');
  v_headers json;
  v_ip text;
begin
  if v_raw is null then
    return null;
  end if;

  begin
    v_headers := v_raw::json;
  exception when others then
    return null;
  end;

  v_ip := coalesce(
    nullif(btrim(v_headers ->> 'cf-connecting-ip'), ''),
    nullif(btrim(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1)), ''),
    nullif(btrim(v_headers ->> 'x-real-ip'), '')
  );
  return left(v_ip, 64);
end;
$$;

-- 3. Cek batas: 5 percobaan gagal per kode pesanan dan 30 per IP, dalam 15 menit.
create or replace function public.assert_track_allowed(p_code text, p_ip text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.track_attempts
    where scope = 'code' and key = left(p_code, 64)
      and created_at > now() - interval '15 minutes'
  ) >= 5 then
    raise exception 'too_many_attempts';
  end if;

  if p_ip is not null and (
    select count(*) from public.track_attempts
    where scope = 'ip' and key = p_ip
      and created_at > now() - interval '15 minutes'
  ) >= 30 then
    raise exception 'too_many_attempts';
  end if;
end;
$$;

-- 4. Catat percobaan gagal. Kunci per kode hanya untuk kode yang benar-benar ada
--    (mencegah tabel dibanjiri kode acak). Baris lama dibersihkan sesekali.
create or replace function public.record_failed_attempt(p_code text, p_ip text, p_code_exists boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_code_exists then
    insert into public.track_attempts (scope, key) values ('code', left(p_code, 64));
  end if;
  if p_ip is not null then
    insert into public.track_attempts (scope, key) values ('ip', p_ip);
  end if;

  if random() < 0.05 then
    delete from public.track_attempts where created_at < now() - interval '1 day';
  end if;
end;
$$;

-- 5. track_order: sekarang volatile (menulis catatan) dan dibatasi.
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

-- 6. submit_payment_proof: pembatasan yang sama. Pesanan tidak cocok dikembalikan sebagai nilai
--    (bukan exception) agar catatan percobaan gagal tidak ikut dibatalkan.
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
  v_code text := upper(btrim(coalesce(p_order_code, '')));
  v_ip text := public.client_ip();
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_final_ai public.ai_status;
begin
  perform public.assert_track_allowed(v_code, v_ip);

  select * into v_order from public.orders where order_code = v_code;

  if v_order.id is null
     or not (
       v_order.customer_phone = public.normalize_phone(p_phone)
       or (v_order.user_id is not null and v_order.user_id = (select auth.uid()))
     ) then
    perform public.record_failed_attempt(v_code, v_ip, v_order.id is not null);
    return jsonb_build_object('error', 'order_not_found');
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

-- 7. Hak eksekusi: fungsi bantu hanya dipanggil dari fungsi lain.
revoke all on function public.client_ip() from public, anon, authenticated;
revoke all on function public.assert_track_allowed(text, text) from public, anon, authenticated;
revoke all on function public.record_failed_attempt(text, text, boolean) from public, anon, authenticated;