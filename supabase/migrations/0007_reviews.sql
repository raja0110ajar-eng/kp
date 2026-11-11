-- =====================================================================
-- Karsa Pandiga - Migrasi 0007: ulasan produk terverifikasi + moderasi
-- =====================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_featured_approved_chk check (not is_featured or status = 'approved')
);

create index reviews_product_status_idx on public.reviews (product_id, status, created_at desc);

create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

-- Publik hanya melihat ulasan yang sudah disetujui. Penulisan hanya lewat fungsi di bawah.
create policy reviews_select_approved on public.reviews
  for select to anon, authenticated
  using (status = 'approved');
create policy reviews_admin_all on public.reviews
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Daftar item pesanan yang bisa diulas (hanya untuk pesanan berstatus completed).
-- Mengembalikan null bila kode/nomor HP tidak cocok.
create or replace function public.list_reviewable_items(p_order_code text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(btrim(coalesce(p_order_code, '')));
  v_ip text := public.client_ip();
  v_order public.orders%rowtype;
begin
  perform public.assert_track_allowed(v_code, v_ip);

  select * into v_order from public.orders where order_code = v_code;

  if v_order.id is null
     or not (
       v_order.customer_phone = public.normalize_phone(p_phone)
       or (v_order.user_id is not null and v_order.user_id = (select auth.uid()))
     ) then
    perform public.record_failed_attempt(v_code, v_ip, v_order.id is not null);
    return null;
  end if;

  if v_order.status <> 'completed' then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'order_item_id', oi.id,
          'product_name', oi.product_name,
          'review_status', r.status
        ) order by oi.product_name
      )
      from public.order_items oi
      left join public.reviews r on r.order_item_id = oi.id
      where oi.order_id = v_order.id
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.submit_review(
  p_order_code text,
  p_phone text,
  p_order_item_id uuid,
  p_rating integer,
  p_body text
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
  v_item public.order_items%rowtype;
  v_body text := btrim(coalesce(p_body, ''));
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

  if v_order.status <> 'completed' then
    raise exception 'order_not_completed';
  end if;

  select * into v_item from public.order_items
  where id = p_order_item_id and order_id = v_order.id;
  if v_item.id is null then
    raise exception 'item_not_found';
  end if;

  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'invalid_rating';
  end if;
  if char_length(v_body) > 600 then
    raise exception 'review_too_long';
  end if;
  if exists (select 1 from public.reviews where order_item_id = v_item.id) then
    raise exception 'already_reviewed';
  end if;

  insert into public.reviews (order_item_id, product_id, display_name, rating, body)
  values (
    v_item.id,
    v_item.product_id,
    left(initcap(split_part(btrim(v_order.customer_name), ' ', 1)), 40),
    p_rating,
    v_body
  );

  return jsonb_build_object('status', 'pending');
end;
$$;

revoke all on function public.list_reviewable_items(text, text) from public, anon, authenticated;
grant execute on function public.list_reviewable_items(text, text) to anon, authenticated;

revoke all on function public.submit_review(text, text, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.submit_review(text, text, uuid, integer, text) to anon, authenticated;