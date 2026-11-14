import { PRODUCT_COLUMNS } from '@/lib/catalog/columns';
import { createPublicClient } from '@/lib/supabase/public';
import type { ProductSummary } from '@/types/catalog';

/**
 * Karya unggulan di landing page: hanya produk yang ditandai admin, aktif, dan stoknya ada.
 * Gagal query tidak boleh merusak landing page.
 */
export async function getFeaturedProducts(limit: number): Promise<ProductSummary[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('is_active', true)
      .eq('is_featured', true)
      .gt('stock', 0)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Gagal memuat produk unggulan:', error.message);
      return [];
    }
    return (data ?? []) as unknown as ProductSummary[];
  } catch (caught) {
    console.error('Gagal memuat produk unggulan:', caught);
    return [];
  }
}