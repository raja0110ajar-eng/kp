import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';

/** Batas produk unggulan di beranda. */
export const MAX_FEATURED = 4;

export async function getFeaturedFlags(): Promise<Record<string, boolean>> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.from('products').select('id, is_featured');
  if (error) throw new Error(`Gagal memuat produk unggulan: ${error.message}`);

  const flags: Record<string, boolean> = {};
  for (const row of (data ?? []) as unknown as Array<{ id: string; is_featured: boolean }>) {
    flags[row.id] = row.is_featured;
  }
  return flags;
}