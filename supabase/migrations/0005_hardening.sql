-- =====================================================================
-- Karsa Pandiga - Migrasi 0005: penguatan untuk produksi
-- Jalankan sekali di Supabase Dashboard > SQL Editor (setelah 0004).
-- =====================================================================

-- 1. Batas pembuatan pesanan: 10 per jam per IP (bila header IP tersedia). ----------

-- Izinkan nilai scope baru 'order' pada tabel percobaan (nama constraint dicari otomatis).
do $$
declare
  v_name text;
begin
  select conname into v_name
  from pg_constraint
  where conrelid = 'public.track_attempts'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%scope%';

  if v_name is not null then
    execute format('alter table public.track_attempts drop constraint %I', v_name);
  end if;
end;
$$;

alter table public.track_attempts
  add constraint track_attempts_scope_check check (scope in ('code', 'ip', 'order'));

create or replace function public.limit_order_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := public.client_ip();
begin
  if v_ip is not null then
    if (
      select count(*) from public.track_attempts
      where scope = 'order' and key = v_ip
        and created_at > now() - interval '1 hour'
    ) >= 10 then
      raise exception 'too_many_orders';
    end if;

    insert into public.track_attempts (scope, key) values ('order', v_ip);

    if random() < 0.05 then
      delete from public.track_attempts where created_at < now() - interval '1 day';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.limit_order_creation() from public, anon, authenticated;

create trigger orders_limit_creation
  before insert on public.orders
  for each row execute function public.limit_order_creation();

-- 2. Unggah bukti hanya ke folder pesanan yang ada, maksimal 5 berkas per pesanan. -----

create or replace function public.can_upload_proof(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order_id text := split_part(p_name, '/', 1);
begin
  if v_order_id !~ '^[0-9a-f-]{36}$' then
    return false;
  end if;

  if not exists (
    select 1
    from public.orders o
    join public.payments p on p.order_id = o.id
    where o.id::text = v_order_id
      and o.status <> 'cancelled'
      and p.method <> 'cod'
      and p.verification_status in ('awaiting_proof', 'awaiting_review', 'rejected')
  ) then
    return false;
  end if;

  return (
    select count(*) from storage.objects
    where bucket_id = 'payment-proofs' and split_part(name, '/', 1) = v_order_id
  ) < 5;
end;
$$;

revoke all on function public.can_upload_proof(text) from public, anon, authenticated;
grant execute on function public.can_upload_proof(text) to anon, authenticated;

drop policy if exists payment_proofs_insert_public on storage.objects;

create policy payment_proofs_insert_valid_order on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
    and public.can_upload_proof(name)
  );