import { siteConfig } from '@/config/site';
import { toCsv } from '@/lib/admin/csv';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { DeliveryArea, OrderStatus } from '@/types/domain';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function adminClient(): Promise<ServerClient> {
  await requireAdmin();
  return createClient();
}

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// ---------- Asumsi biaya ----------

export interface BusinessSettings {
  laborRatePerHour: number;
  deliveryCostSchool: number;
  deliveryCostOutside: number;
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from('business_settings')
    .select('labor_rate_per_hour, delivery_cost_school, delivery_cost_outside')
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat asumsi biaya: ${error.message}`);

  const row = data as {
    labor_rate_per_hour: number;
    delivery_cost_school: number;
    delivery_cost_outside: number;
  } | null;

  return {
    laborRatePerHour: row?.labor_rate_per_hour ?? 0,
    deliveryCostSchool: row?.delivery_cost_school ?? 0,
    deliveryCostOutside: row?.delivery_cost_outside ?? 0,
  };
}

// ---------- Rentang waktu ----------

export type ReportRange = '7' | '30' | '90' | 'all';

export const REPORT_RANGES: ReadonlyArray<{ value: ReportRange; label: string }> = [
  { value: '7', label: '7 hari' },
  { value: '30', label: '30 hari' },
  { value: '90', label: '90 hari' },
  { value: 'all', label: 'Semua' },
];

export function parseRange(raw: string): ReportRange {
  return raw === '7' || raw === '90' || raw === 'all' ? raw : '30';
}

function rangeStart(range: ReportRange): string | null {
  if (range === 'all') return null;
  return new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();
}

// ---------- Data pembayaran terverifikasi ----------

export interface VerifiedLine {
  productId: string;
  productName: string;
  quantity: number;
  lineTotal: number;
  unitCost: number | null;
}

export interface VerifiedPayment {
  orderCode: string;
  deliveryArea: DeliveryArea;
  shippingFee: number;
  method: string;
  verifiedAt: string;
  aiCheckedAt: string | null;
  lines: VerifiedLine[];
}

interface RawLine {
  product_id: string;
  product_name: string;
  quantity: number;
  line_total: number;
  unit_cost: number | null;
}

interface RawOrder {
  order_code: string;
  status: OrderStatus;
  delivery_area: DeliveryArea;
  shipping_fee: number;
  order_items: RawLine[] | null;
}

interface RawVerifiedPayment {
  method: string;
  verified_at: string;
  ai_checked_at: string | null;
  orders: RawOrder | RawOrder[] | null;
}

const PAGE_SIZE = 500;

async function fetchVerifiedPayments(
  supabase: ServerClient,
  range: ReportRange
): Promise<VerifiedPayment[]> {
  const since = rangeStart(range);
  const result: VerifiedPayment[] = [];
  let from = 0;

  for (;;) {
    let request = supabase
      .from('payments')
      .select(
        'method, verified_at, ai_checked_at, orders!inner(order_code, status, delivery_area, shipping_fee, order_items(product_id, product_name, quantity, line_total, unit_cost))'
      )
      .eq('verification_status', 'verified');
    if (since) request = request.gte('verified_at', since);

    const { data, error } = await request
      .order('verified_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Gagal memuat data penjualan: ${error.message}`);

    const rows = (data ?? []) as unknown as RawVerifiedPayment[];
    for (const row of rows) {
      const order = firstOf(row.orders);
      if (!order || order.status === 'cancelled') continue;
      result.push({
        orderCode: order.order_code,
        deliveryArea: order.delivery_area,
        shippingFee: order.shipping_fee,
        method: row.method,
        verifiedAt: row.verified_at,
        aiCheckedAt: row.ai_checked_at,
        lines: (order.order_items ?? []).map((line) => ({
          productId: line.product_id,
          productName: line.product_name,
          quantity: line.quantity,
          lineTotal: line.line_total,
          unitCost: line.unit_cost,
        })),
      });
    }

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return result;
}

async function fetchCohortStatuses(
  supabase: ServerClient,
  range: ReportRange
): Promise<OrderStatus[]> {
  const since = rangeStart(range);
  const statuses: OrderStatus[] = [];
  let from = 0;

  for (;;) {
    let request = supabase.from('orders').select('status');
    if (since) request = request.gte('created_at', since);

    const { data, error } = await request
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`Gagal memuat corong pesanan: ${error.message}`);

    const rows = (data ?? []) as unknown as Array<{ status: OrderStatus }>;
    for (const row of rows) statuses.push(row.status);

    if (rows.length < 1000) break;
    from += 1000;
  }

  return statuses;
}

// ---------- Laporan ----------

export interface ProductReportRow {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number | null;
  /** true bila semua unit terjual punya HPP. */
  fullyCosted: boolean;
}

export interface SalesReport {
  range: ReportRange;
  settings: BusinessSettings;
  verifiedOrders: number;
  goodsRevenue: number;
  shippingIncome: number;
  revenueWithCost: number;
  knownCost: number;
  grossProfit: number;
  marginPercent: number | null;
  costCoveragePercent: number | null;
  deliveryCost: number;
  profitAfterDelivery: number;
  averageOrderValue: number | null;
  funnel: {
    created: number;
    pending: number;
    verifiedProgress: number;
    cancelled: number;
    conversionPercent: number | null;
  };
  confirmation: {
    samples: number;
    averageHours: number | null;
    withinPromisePercent: number | null;
    promiseHours: number;
  };
  products: ProductReportRow[];
}

export async function getSalesReport(range: ReportRange): Promise<SalesReport> {
  const supabase = await adminClient();
  const [settings, payments, cohort] = await Promise.all([
    getBusinessSettings(),
    fetchVerifiedPayments(supabase, range),
    fetchCohortStatuses(supabase, range),
  ]);

  let goodsRevenue = 0;
  let shippingIncome = 0;
  let revenueWithCost = 0;
  let knownCost = 0;
  let deliveryCost = 0;

  const perProduct = new Map<
    string,
    { name: string; units: number; revenue: number; cost: number; revenueWithCost: number; unitsWithCost: number }
  >();

  const confirmHours: number[] = [];

  for (const payment of payments) {
    shippingIncome += payment.shippingFee;
    deliveryCost +=
      payment.deliveryArea === 'school' ? settings.deliveryCostSchool : settings.deliveryCostOutside;

    if (payment.method !== 'cod' && payment.aiCheckedAt) {
      const hours =
        (new Date(payment.verifiedAt).getTime() - new Date(payment.aiCheckedAt).getTime()) / 3_600_000;
      if (Number.isFinite(hours) && hours >= 0) confirmHours.push(hours);
    }

    for (const line of payment.lines) {
      goodsRevenue += line.lineTotal;

      const entry = perProduct.get(line.productId) ?? {
        name: line.productName,
        units: 0,
        revenue: 0,
        cost: 0,
        revenueWithCost: 0,
        unitsWithCost: 0,
      };
      entry.units += line.quantity;
      entry.revenue += line.lineTotal;

      if (line.unitCost !== null) {
        const lineCost = line.unitCost * line.quantity;
        revenueWithCost += line.lineTotal;
        knownCost += lineCost;
        entry.cost += lineCost;
        entry.revenueWithCost += line.lineTotal;
        entry.unitsWithCost += line.quantity;
      }
      perProduct.set(line.productId, entry);
    }
  }

  const grossProfit = revenueWithCost - knownCost;
  const verifiedOrders = payments.length;

  const products: ProductReportRow[] = Array.from(perProduct.entries())
    .map(([productId, entry]) => {
      const profit = entry.revenueWithCost - entry.cost;
      return {
        productId,
        name: entry.name,
        units: entry.units,
        revenue: entry.revenue,
        cost: entry.cost,
        profit,
        marginPercent: entry.revenueWithCost > 0 ? (profit / entry.revenueWithCost) * 100 : null,
        fullyCosted: entry.unitsWithCost === entry.units,
      };
    })
    .sort((a, b) => b.units - a.units);

  const created = cohort.length;
  const pending = cohort.filter(
    (status) => status === 'awaiting_payment' || status === 'awaiting_verification'
  ).length;
  const verifiedProgress = cohort.filter(
    (status) => status === 'processing' ||
      status === 'ready' ||
      status === 'delivering' ||
      status === 'completed'
  ).length;
  const cancelled = cohort.filter((status) => status === 'cancelled').length;

  const promiseHours = siteConfig.service.confirmationHours;
  const within = confirmHours.filter((hours) => hours <= promiseHours).length;

  return {
    range,
    settings,
    verifiedOrders,
    goodsRevenue,
    shippingIncome,
    revenueWithCost,
    knownCost,
    grossProfit,
    marginPercent: revenueWithCost > 0 ? (grossProfit / revenueWithCost) * 100 : null,
    costCoveragePercent: goodsRevenue > 0 ? (revenueWithCost / goodsRevenue) * 100 : null,
    deliveryCost,
    profitAfterDelivery: grossProfit + shippingIncome - deliveryCost,
    averageOrderValue:
      verifiedOrders > 0 ? Math.round((goodsRevenue + shippingIncome) / verifiedOrders) : null,
    funnel: {
      created,
      pending,
      verifiedProgress,
      cancelled,
      conversionPercent: created > 0 ? (verifiedProgress / created) * 100 : null,
    },
    confirmation: {
      samples: confirmHours.length,
      averageHours:
        confirmHours.length > 0
          ? confirmHours.reduce((sum, hours) => sum + hours, 0) / confirmHours.length
          : null,
      withinPromisePercent: confirmHours.length > 0 ? (within / confirmHours.length) * 100 : null,
      promiseHours,
    },
    products,
  };
}

// ---------- Ekspor CSV (tanpa data pribadi pembeli) ----------

const csvDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Jakarta',
  dateStyle: 'short',
  timeStyle: 'short',
});

export async function buildSalesCsv(range: ReportRange): Promise<string> {
  const supabase = await adminClient();
  const payments = await fetchVerifiedPayments(supabase, range);

  const rows: Array<Array<string | number | null>> = [
    [
      'Kode pesanan',
      'Tanggal verifikasi',
      'Produk',
      'Jumlah',
      'Harga satuan',
      'Omzet',
      'HPP satuan',
      'HPP total',
      'Laba kotor',
    ],
  ];

  for (const payment of payments) {
    for (const line of payment.lines) {
      const lineCost = line.unitCost === null ? null : line.unitCost * line.quantity;
      rows.push([
        payment.orderCode,
        csvDate.format(new Date(payment.verifiedAt)),
        line.productName,
        line.quantity,
        Math.round(line.lineTotal / line.quantity),
        line.lineTotal,
        line.unitCost,
        lineCost,
        lineCost === null ? null : line.lineTotal - lineCost,
      ]);
    }
  }

  return toCsv(rows);
}