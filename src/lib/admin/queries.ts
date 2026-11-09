import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/phone';
import type {
  AdminOrderDetail,
  AdminOrderList,
  AdminPaymentReview,
  AdminPaymentSetting,
  AdminProduct,
  AdminShippingZone,
  DashboardSummary,
  PaymentQueueFilter,
} from '@/lib/admin/types';
import type { OnlinePaymentMethod } from '@/types/catalog';
import type {
  AiStatus,
  DeliveryArea,
  OrderStatus,
  PaymentMethod,
  ProductType,
  VerificationStatus,
} from '@/types/domain';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export const QUEUE_LIMIT = 50;
export const ORDERS_PAGE_SIZE = 20;
const PROOF_URL_TTL_SECONDS = 60;
const LOW_STOCK_THRESHOLD = 5;

// Setiap query admin memverifikasi admin lebih dulu (layout tidak di-render ulang di tiap navigasi).
async function adminClient(): Promise<ServerClient> {
  await requireAdmin();
  return createClient();
}

// Relasi embed PostgREST bisa berbentuk objek atau array tergantung relasinya.
function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function signProofUrl(supabase: ServerClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(path, PROOF_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

// ---------- Antrean verifikasi ----------

interface RawOrderRef {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: OrderStatus;
}

interface RawPaymentReview {
  id: string;
  method: PaymentMethod;
  expected_amount: number;
  proof_path: string | null;
  ocr_raw_text: string | null;
  ocr_detected_amounts: number[] | null;
  ocr_matched_amount: number | null;
  ocr_confidence: number | string | null;
  ai_status: AiStatus;
  ai_checked_at: string | null;
  created_at: string;
  updated_at: string;
  orders: RawOrderRef | RawOrderRef[] | null;
}

const PAYMENT_QUEUE_COLUMNS =
  'id, method, expected_amount, proof_path, ocr_raw_text, ocr_detected_amounts, ocr_matched_amount, ocr_confidence, ai_status, ai_checked_at, created_at, updated_at, orders!inner(id, order_code, customer_name, customer_phone, total, status)';

export async function getPaymentQueue(filter: PaymentQueueFilter): Promise<AdminPaymentReview[]> {
  const supabase = await adminClient();

  let request = supabase
    .from('payments')
    .select(PAYMENT_QUEUE_COLUMNS)
    .eq('verification_status', 'awaiting_review');
  if (filter === 'cod') request = request.eq('method', 'cod');
  if (filter === 'transfer') request = request.neq('method', 'cod');

  const { data, error } = await request.order('updated_at', { ascending: true }).limit(QUEUE_LIMIT);
  if (error) throw new Error(`Gagal memuat antrean verifikasi: ${error.message}`);

  const rows = (data ?? []) as unknown as RawPaymentReview[];
  const reviews = await Promise.all(
    rows.map(async (row): Promise<AdminPaymentReview | null> => {
      const order = firstOf(row.orders);
      if (!order) return null;

      const proofUrl = row.proof_path ? await signProofUrl(supabase, row.proof_path) : null;
      return {
        paymentId: row.id,
        orderId: order.id,
        orderCode: order.order_code,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        method: row.method,
        expectedAmount: row.expected_amount,
        aiStatus: row.ai_status,
        detectedAmounts: row.ocr_detected_amounts ?? [],
        matchedAmount: row.ocr_matched_amount,
        confidence: row.ocr_confidence === null ? null : Number(row.ocr_confidence),
        rawText: row.ocr_raw_text,
        proofUrl,
        waitingSince: row.ai_checked_at ?? row.created_at,
      };
    })
  );

  return reviews.filter((review): review is AdminPaymentReview => review !== null);
}

// ---------- Pesanan ----------

interface RawPaymentBrief {
  method: PaymentMethod;
  ai_status: AiStatus;
  verification_status: VerificationStatus;
}

interface RawOrderListRow {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  delivery_area: DeliveryArea;
  total: number;
  status: OrderStatus;
  created_at: string;
  payments: RawPaymentBrief | RawPaymentBrief[] | null;
}

// Karakter yang punya arti di sintaks filter PostgREST / pola LIKE dibuang dari input pencarian.
function sanitizeOrderSearch(input: string): string {
  return input.replace(/[,()%_*:"'\\]/g, ' ').trim().slice(0, 40);
}

export async function getAdminOrders(params: {
  status: OrderStatus | null;
  search: string;
  page: number;
}): Promise<AdminOrderList> {
  const supabase = await adminClient();
  const page = Math.max(1, Math.floor(params.page));
  const from = (page - 1) * ORDERS_PAGE_SIZE;
  const to = from + ORDERS_PAGE_SIZE - 1;

  let request = supabase
    .from('orders')
    .select(
      'id, order_code, customer_name, customer_phone, delivery_area, total, status, created_at, payments(method, ai_status, verification_status)',
      { count: 'exact' }
    );

  if (params.status) request = request.eq('status', params.status);

  const search = sanitizeOrderSearch(params.search);
  if (search) {
    const phoneTerm = /^[0-9+\s-]+$/.test(search) ? normalizePhone(search) : search;
    request = request.or(
      `order_code.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${phoneTerm}%`
    );
  }

  const { data, error, count } = await request
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);

  const rows = (data ?? []) as unknown as RawOrderListRow[];
  return {
    items: rows.map((row) => {
      const payment = firstOf(row.payments);
      return {
        id: row.id,
        orderCode: row.order_code,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        deliveryArea: row.delivery_area,
        total: row.total,
        status: row.status,
        createdAt: row.created_at,
        paymentMethod: payment?.method ?? null,
        verificationStatus: payment?.verification_status ?? null,
        aiStatus: payment?.ai_status ?? null,
      };
    }),
    total: count ?? 0,
    page,
    pageSize: ORDERS_PAGE_SIZE,
  };
}

interface RawOrderItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface RawOrderPayment {
  id: string;
  method: PaymentMethod;
  expected_amount: number;
  ai_status: AiStatus;
  verification_status: VerificationStatus;
  admin_note: string | null;
  verified_at: string | null;
  proof_path: string | null;
}

interface RawOrderDetail {
  id: string;
  order_code: string;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  delivery_area: DeliveryArea;
  shipping_zone_name: string | null;
  delivery_address: string;
  notes: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  order_items: RawOrderItem[] | null;
  payments: RawOrderPayment | RawOrderPayment[] | null;
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = await adminClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_code, status, created_at, customer_name, customer_phone, delivery_area, shipping_zone_name, delivery_address, notes, subtotal, shipping_fee, total, order_items(product_name, unit_price, quantity, line_total), payments(id, method, expected_amount, ai_status, verification_status, admin_note, verified_at, proof_path)'
    )
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as RawOrderDetail;
  const payment = firstOf(row.payments);
  const proofUrl = payment?.proof_path ? await signProofUrl(supabase, payment.proof_path) : null;

  return {
    id: row.id,
    orderCode: row.order_code,
    status: row.status,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryArea: row.delivery_area,
    shippingZoneName: row.shipping_zone_name,
    deliveryAddress: row.delivery_address,
    notes: row.notes,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    items: (row.order_items ?? []).map((item) => ({
      productName: item.product_name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
    })),
    payment: payment
      ? {
          id: payment.id,
          method: payment.method,
          expectedAmount: payment.expected_amount,
          aiStatus: payment.ai_status,
          verificationStatus: payment.verification_status,
          adminNote: payment.admin_note,
          verifiedAt: payment.verified_at,
          proofUrl,
        }
      : null,
  };
}

// ---------- Produk ----------

interface RawProductCost {
  reseller_name: string | null;
  cost_price: number | null;
}

interface RawAdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_path: string | null;
  product_type: ProductType;
  is_active: boolean;
  product_costs: RawProductCost | RawProductCost[] | null;
}

const ADMIN_PRODUCT_COLUMNS =
  'id, slug, name, description, price, stock, image_path, product_type, is_active, product_costs(reseller_name, cost_price)';

function mapAdminProduct(row: RawAdminProduct): AdminProduct {
  const cost = firstOf(row.product_costs);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    imagePath: row.image_path,
    productType: row.product_type,
    isActive: row.is_active,
    resellerName: cost?.reseller_name ?? null,
    costPrice: cost?.cost_price ?? null,
  };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from('products')
    .select(ADMIN_PRODUCT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  return ((data ?? []) as unknown as RawAdminProduct[]).map(mapAdminProduct);
}

export async function getAdminProduct(productId: string): Promise<AdminProduct | null> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from('products')
    .select(ADMIN_PRODUCT_COLUMNS)
    .eq('id', productId)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  return data ? mapAdminProduct(data as unknown as RawAdminProduct) : null;
}

// ---------- Zona tarif & setelan pembayaran ----------

interface RawZone {
  id: string;
  name: string;
  fee: number;
  is_active: boolean;
  sort_order: number;
}

export async function getAdminShippingZones(): Promise<AdminShippingZone[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from('shipping_zones')
    .select('id, name, fee, is_active, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(`Gagal memuat zona pengiriman: ${error.message}`);

  return ((data ?? []) as unknown as RawZone[]).map((row) => ({
    id: row.id,
    name: row.name,
    fee: row.fee,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

interface RawPaymentSetting {
  method: OnlinePaymentMethod;
  is_active: boolean;
  display_name: string;
  account_name: string | null;
  account_number: string | null;
  instructions: string;
  qris_image_path: string | null;
  sort_order: number;
}

export async function getAdminPaymentSettings(): Promise<AdminPaymentSetting[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from('payment_settings')
    .select(
      'method, is_active, display_name, account_name, account_number, instructions, qris_image_path, sort_order'
    )
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Gagal memuat setelan pembayaran: ${error.message}`);

  return ((data ?? []) as unknown as RawPaymentSetting[]).map((row) => ({
    method: row.method,
    isActive: row.is_active,
    displayName: row.display_name,
    accountName: row.account_name,
    accountNumber: row.account_number,
    instructions: row.instructions,
    qrisImagePath: row.qris_image_path,
    sortOrder: row.sort_order,
  }));
}

// ---------- Ringkasan ----------

async function readCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(`Gagal menghitung data: ${error.message}`);
  return count ?? 0;
}

interface RawRevenueRow {
  expected_amount: number;
  orders: { status: OrderStatus } | { status: OrderStatus }[] | null;
}

// Omzet = total pesanan yang pembayarannya terverifikasi/dikonfirmasi dan tidak dibatalkan.
// Dibaca bertahap 1000 baris agar tidak terpotong batas default PostgREST.
async function readVerifiedRevenue(
  supabase: ServerClient
): Promise<{ orders: number; revenue: number }> {
  const pageSize = 1000;
  let from = 0;
  let orders = 0;
  let revenue = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('payments')
      .select('expected_amount, orders!inner(status)')
      .eq('verification_status', 'verified')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Gagal menghitung omzet: ${error.message}`);

    const rows = (data ?? []) as unknown as RawRevenueRow[];
    for (const row of rows) {
      const order = firstOf(row.orders);
      if (order && order.status !== 'cancelled') {
        orders += 1;
        revenue += row.expected_amount;
      }
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return { orders, revenue };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await adminClient();

  const [awaitingReview, processing, delivering, lowStock, verified] = await Promise.all([
    readCount(
      supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'awaiting_review')
    ),
    readCount(
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'processing')
    ),
    readCount(
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivering')
    ),
    readCount(
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('stock', LOW_STOCK_THRESHOLD)
    ),
    readVerifiedRevenue(supabase),
  ]);

  return {
    awaitingReview,
    processing,
    delivering,
    lowStock,
    verifiedOrders: verified.orders,
    revenue: verified.revenue,
  };
}