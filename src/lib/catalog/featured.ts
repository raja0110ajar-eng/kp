import { PRODUCT_COLUMNS } from '@/lib/catalog/columns';
import { createPublicClient } from '@/lib/supabase/public';
import type { ProductSummary } from '@/types/catalog';

/**
 * Produk pilihan untuk landing page: aktif dan stok tersedia, "Karya Kami" lebih dulu
 * (urutan enum product_type), lalu yang terbaru. Gagal query tidak boleh merusak landing page.
 */
export async function getFeaturedProducts(limit: number): Promise<ProductSummary[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('product_type', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Gagal memuat produk pilihan:', error.message);
      return [];
    }
    return (data ?? []) as unknown as ProductSummary[];
  } catch (caught) {
    console.error('Gagal memuat produk pilihan:', caught);
    return [];
  }
}