import { createClient } from '@/lib/supabase/server';
import type { MyOrderList, TrackedOrderDetail } from '@/types/tracking';
import type {
  AiStatus,
  DeliveryArea,
  OrderStatus,
  PaymentMethod,
  VerificationStatus,
} from '@/types/domain';

export const MY_ORDERS_PAGE_SIZE = 10;

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}

interface RawPaymentBrief {
  method: PaymentMethod;
  verification_status: VerificationStatus;
}

interface RawMyOrderRow {
  order_code: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  payments: RawPaymentBrief | RawPaymentBrief[] | null;
}

// PENTING: filter user_id eksplisit. Policy RLS admin bisa membaca SEMUA pesanan,
// jadi tanpa filter ini akun admin akan melihat pesanan orang lain di halaman pembeli.
export async function getMyOrders(userId: string, page: number): Promise<MyOrderList> {
  const supabase = await createClient();
  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * MY_ORDERS_PAGE_SIZE;
  const to = from + MY_ORDERS_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('orders')
    .select('order_code, status, total, created_at, payments(method, verification_status)', {
      count: 'exact',
    })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);

  const rows = (data ?? []) as unknown as RawMyOrderRow[];
  return {
    items: rows.map((row) => {
      const payment = firstOf(row.payments);
      return {
        orderCode: row.order_code,
        status: row.status,
        total: row.total,
        createdAt: row.created_at,
        paymentMethod: payment?.method ?? null,
        verificationStatus: payment?.verification_status ?? null,
      };
    }),
    total: count ?? 0,
    page: safePage,
    pageSize: MY_ORDERS_PAGE_SIZE,
  };
}

interface RawOrderItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface RawOwnedPayment {
  id: string;
  method: PaymentMethod;
  expected_amount: number;
  ai_status: AiStatus;
  verification_status: VerificationStatus;
  admin_note: string | null;
}

interface RawOwnedOrder {
  id: string;
  order_code: string;
  status: OrderStatus;
  delivery_area: DeliveryArea;
  customer_name: string;
  delivery_address: string;
  shipping_zone_name: string | null;
  notes: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  order_items: RawOrderItem[] | null;
  payments: RawOwnedPayment | RawOwnedPayment[] | null;
}

/** Pesanan milik pembeli yang login (tanpa perlu nomor HP). Null jika bukan miliknya / tidak ada. */
export async function getMyOrderByCode(
  userId: string,
  orderCode: string
): Promise<TrackedOrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_code, status, delivery_area, customer_name, delivery_address, shipping_zone_name, notes, subtotal, shipping_fee, total, created_at, updated_at, order_items(product_name, unit_price, quantity, line_total), payments(id, method, expected_amount, ai_status, verification_status, admin_note)'
    )
    .eq('order_code', orderCode)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as RawOwnedOrder;
  const payment = firstOf(row.payments);
  if (!payment) return null;

  return {
    order_id: row.id,
    order_code: row.order_code,
    status: row.status,
    delivery_area: row.delivery_area,
    customer_name: row.customer_name,
    delivery_address: row.delivery_address,
    shipping_zone_name: row.shipping_zone_name,
    notes: row.notes,
    subtotal: row.subtotal,
    shipping_fee: row.shipping_fee,
    total: row.total,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: [...(row.order_items ?? [])].sort((a, b) => a.product_name.localeCompare(b.product_name)),
    payment: {
      id: payment.id,
      method: payment.method,
      expected_amount: payment.expected_amount,
      ai_status: payment.ai_status,
      verification_status: payment.verification_status,
      admin_note: payment.admin_note,
    },
  };
}