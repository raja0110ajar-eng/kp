'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { MAX_FEATURED } from '@/lib/admin/featured';
import { UUID_REGEX } from '@/lib/admin/validation';

export async function toggleProductFeaturedAction(
  productId: string,
  featured: boolean
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID_REGEX.test(productId)) return { ok: false, error: 'ID produk tidak valid.' };

  const supabase = await createClient();

  if (featured) {
    const { data: product, error: readError } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', productId)
      .maybeSingle();
    if (readError) return { ok: false, error: getAdminErrorMessage(readError.message) };
    if (!product || (product as { is_active: boolean }).is_active !== true) {
      return { ok: false, error: 'Hanya produk aktif yang bisa dijadikan unggulan.' };
    }

    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_featured', true)
      .eq('is_active', true)
      .neq('id', productId);
    if (countError) return { ok: false, error: getAdminErrorMessage(countError.message) };
    if ((count ?? 0) >= MAX_FEATURED) {
      return { ok: false, error: `Maksimal ${MAX_FEATURED} produk unggulan. Lepas salah satu dulu.` };
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_featured: featured })
    .eq('id', productId)
    .select('id');
  if (error) return { ok: false, error: getAdminErrorMessage(error.message) };
  if (!data || data.length === 0) return { ok: false, error: 'Produk tidak ditemukan.' };

  revalidatePath('/admin', 'layout');
  revalidatePath('/');
  return {
    ok: true,
    message: featured ? 'Produk tampil di Karya unggulan.' : 'Produk dilepas dari Karya unggulan.',
  };
}