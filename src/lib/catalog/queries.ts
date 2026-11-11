import { createClient } from '@/lib/supabase/server';
import { PRODUCT_COLUMNS } from '@/lib/catalog/columns';
import type { Category, PaymentSetting, ProductSummary, ShippingZone } from '@/types/catalog';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface ProductFilter {
  categoryId: string | null;
  query: string;
}

// Karakter wildcard LIKE dibuang agar input pengguna tidak mengubah pola pencarian.
function sanitizeSearch(query: string): string {
  return query.replace(/[%_\\]/g, ' ').trim().slice(0, 60);
}

export async function getActiveProducts(filter: ProductFilter): Promise<ProductSummary[]> {
  const supabase = await createClient();

  let request = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filter.categoryId) {
    request = request.eq('category_id', filter.categoryId);
  }
  const search = sanitizeSearch(filter.query);
  if (search) {
    request = request.ilike('name', `%${search}%`);
  }

  const { data, error } = await request;
  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  return (data ?? []) as unknown as ProductSummary[];
}

export async function getProductBySlug(slug: string): Promise<ProductSummary | null> {
  if (!SLUG_REGEX.test(slug)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  return (data as unknown as ProductSummary | null) ?? null;
}

/** Produk lain yang masih tersedia, diprioritaskan dari kategori yang sama. */
export async function getRelatedProducts(
  product: ProductSummary,
  limit: number
): Promise<ProductSummary[]> {
  const supabase = await createClient();

  let request = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .gt('stock', 0)
    .neq('id', product.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (product.category_id) {
    request = request.eq('category_id', product.category_id);
  }

  const { data, error } = await request;
  if (error) throw new Error(`Gagal memuat produk terkait: ${error.message}`);
  return (data ?? []) as unknown as ProductSummary[];
}

export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  return (data ?? []) as unknown as Category[];
}

export async function getActiveShippingZones(): Promise<ShippingZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shipping_zones')
    .select('id, name, fee')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Gagal memuat zona pengiriman: ${error.message}`);
  return (data ?? []) as unknown as ShippingZone[];
}

export async function getActivePaymentSettings(): Promise<PaymentSetting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payment_settings')
    .select('method, display_name, account_name, account_number, instructions, qris_image_path')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Gagal memuat setelan pembayaran: ${error.message}`);
  return (data ?? []) as unknown as PaymentSetting[];
}