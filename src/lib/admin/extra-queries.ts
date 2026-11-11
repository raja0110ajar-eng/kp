import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { AdminCategory, AdminReview } from '@/lib/admin/types';

async function adminClient() {
  await requireAdmin();
  return createClient();
}

interface RawCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);

  return ((data ?? []) as unknown as RawCategory[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }));
}

interface RawAdminReview {
  id: string;
  rating: number;
  body: string;
  display_name: string;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at: string;
  products: { name: string } | { name: string }[] | null;
}

export async function getAdminReviews(
  status: 'pending' | 'approved' | 'rejected'
): Promise<AdminReview[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, body, display_name, status, is_featured, created_at, products(name)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(`Gagal memuat ulasan: ${error.message}`);

  return ((data ?? []) as unknown as RawAdminReview[]).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      id: row.id,
      rating: row.rating,
      body: row.body,
      displayName: row.display_name,
      status: row.status,
      isFeatured: row.is_featured,
      createdAt: row.created_at,
      productName: product?.name ?? 'Produk',
    };
  });
}

export async function countPendingReviews(): Promise<number> {
  const supabase = await adminClient();
  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw new Error(`Gagal menghitung ulasan: ${error.message}`);
  return count ?? 0;
}