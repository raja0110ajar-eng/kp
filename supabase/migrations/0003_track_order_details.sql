-- =====================================================================
-- Karsa Pandiga - Migrasi 0003: perluas track_order
-- Menambah: lokasi pengantaran, nama zona, catatan, dan waktu pembaruan terakhir.
-- Jalankan sekali di Supabase Dashboard > SQL Editor (setelah 0002).
-- =====================================================================

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