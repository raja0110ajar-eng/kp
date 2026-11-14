-- =====================================================================
-- Karsa Pandiga - Migrasi 0010: notifikasi admin lewat Telegram (pg_net)
-- Jalankan SETELAH 0009. Kunci bot TIDAK ditulis di sini: dimasukkan lewat SQL Editor.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- Rahasia aplikasi (token bot, id grup, alamat situs). RLS aktif tanpa policy:
-- hanya fungsi database dan SQL Editor yang bisa membacanya.
create table public.app_secrets (
  key text primary key,
  value text not null check (char_length(value) between 1 and 500),
  updated_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

create or replace function public.format_rupiah(p_amount integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'Rp ' || replace(to_char(p_amount, 'FM999,999,999,999'), ',', '.');
$$;

revoke all on function public.format_rupiah(integer) from public, anon, authenticated;

-- Mengirim satu pesan ke grup admin. Tidak pernah melempar error.
create or replace function public.notify_admins(p_text text, p_path text default '/admin')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_chat text;
  v_site text;
  v_body jsonb;
begin
  select value into v_token from public.app_secrets where key = 'telegram_bot_token';
  select value into v_chat from public.app_secrets where key = 'telegram_chat_id';
  select value into v_site from public.app_secrets where key = 'site_url';

  if v_token is null or v_chat is null then
    return;
  end if;

  v_body := jsonb_build_object(
    'chat_id', case when v_chat ~ '^-?[0-9]+$' then to_jsonb(v_chat::bigint) else to_jsonb(v_chat) end,
    'text', left(p_text, 1000),
    'disable_web_page_preview', true
  );

  if v_site is not null and v_site ~ '^https://' then
    v_body := v_body || jsonb_build_object(
      'reply_markup',
      jsonb_build_object(
        'inline_keyboard',
        jsonb_build_array(
          jsonb_build_array(
            jsonb_build_object('text', 'Buka dashboard', 'url', rtrim(v_site, '/') || p_path)
          )
        )
      )
    );
  end if;

  perform net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := v_body,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
exception when others then
  return;
end;
$$;

revoke all on function public.notify_admins(text, text) from public, anon, authenticated;

-- Pesanan baru (setiap baris payments dibuat bersama pesanan oleh create_order).
create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_items integer;
  v_area text;
  v_method text;
begin
  select * into v_order from public.orders where id = new.order_id;
  if v_order.id is null then
    return new;
  end if;

  select coalesce(sum(quantity), 0) into v_items from public.order_items where order_id = new.order_id;

  v_area := case
    when v_order.delivery_area = 'school' then 'area sekolah'
    else 'luar sekolah' || coalesce(' (' || v_order.shipping_zone_name || ')', '')
  end;

  v_method := case new.method::text
    when 'qris' then 'QRIS'
    when 'dana' then 'DANA'
    when 'ovo' then 'OVO'
    when 'gopay' then 'GoPay'
    when 'bank_transfer' then 'Transfer bank'
    else 'COD'
  end;

  if new.method = 'cod' then
    perform public.notify_admins(
      'Pesanan COD baru ' || v_order.order_code || E'\n'
        || public.format_rupiah(v_order.total) || ' · ' || v_items || ' item · ' || v_area
        || E'\nPerlu dikonfirmasi.',
      '/admin/payments?method=cod'
    );
  else
    perform public.notify_admins(
      'Pesanan baru ' || v_order.order_code || E'\n'
        || public.format_rupiah(v_order.total) || ' · ' || v_method || ' · ' || v_items || ' item · ' || v_area
        || E'\nMenunggu bukti transfer.',
      '/admin/orders'
    );
  end if;

  return new;
exception when others then
  return new;
end;
$$;

revoke all on function public.notify_new_order() from public, anon, authenticated;

create trigger payments_notify_new_order
  after insert on public.payments
  for each row execute function public.notify_new_order();

-- Bukti transfer masuk (status berubah menjadi awaiting_review untuk pertama kali).
create or replace function public.notify_payment_proof()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_ai text;
begin
  if new.method = 'cod'
     or new.verification_status <> 'awaiting_review'
     or old.verification_status = 'awaiting_review' then
    return new;
  end if;

  select * into v_order from public.orders where id = new.order_id;
  if v_order.id is null then
    return new;
  end if;

  v_ai := case new.ai_status::text
    when 'matched' then 'AI: nominal cocok'
    when 'mismatch' then 'AI: nominal tidak cocok'
    when 'unreadable' then 'AI: bukti tidak terbaca'
    else 'AI: belum diperiksa'
  end;

  perform public.notify_admins(
    'Bukti transfer masuk ' || v_order.order_code || E'\n'
      || public.format_rupiah(new.expected_amount) || ' · ' || v_ai
      || E'\nPerlu diverifikasi.',
    '/admin/payments'
  );

  return new;
exception when others then
  return new;
end;
$$;

revoke all on function public.notify_payment_proof() from public, anon, authenticated;

create trigger payments_notify_proof
  after update of verification_status on public.payments
  for each row execute function public.notify_payment_proof();