'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, FormState } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { parseProductForm } from '@/lib/admin/product-input';
import { UUID_REGEX } from '@/lib/admin/validation';

const ASSET_BUCKET = 'public-assets';

export async function saveProductAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return { status: 'error', message: parsed.error };
  const input = parsed.value;

  const supabase = await createClient();
  const isCreate = input.id === null;
  let productId: string;
  let previousPaths: string[] = [];

  const sharedFields = {
    name: input.name,
    description: input.description,
    price: input.price,
    stock: input.stock,
    product_type: input.productType,
    category_id: input.categoryId,
    is_active: input.isActive,
    image_path: input.imagePath,
    gallery_paths: input.galleryPaths,
    materials: input.materials,
    dimensions: input.dimensions,
    weight_grams: input.weightGrams,
    lead_time_days: input.leadTimeDays,
  };

  if (input.id === null) {
    const { data, error } = await supabase
      .from('products')
      .insert({ slug: input.slug, ...sharedFields })
      .select('id')
      .single();
    if (error || !data) {
      return { status: 'error', message: getAdminErrorMessage(error?.message ?? 'unknown') };
    }
    productId = (data as { id: string }).id;
  } else {
    const { data: current, error: readError } = await supabase
      .from('products')
      .select('image_path, gallery_paths')
      .eq('id', input.id)
      .maybeSingle();
    if (readError) return { status: 'error', message: getAdminErrorMessage(readError.message) };
    if (!current) return { status: 'error', message: 'Produk tidak ditemukan.' };

    const row = current as { image_path: string | null; gallery_paths: string[] | null };
    previousPaths = [...(row.image_path ? [row.image_path] : []), ...(row.gallery_paths ?? [])];

    const { error } = await supabase.from('products').update(sharedFields).eq('id', input.id);
    if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };
    productId = input.id;
  }

  const hasCost =
    input.costPrice !== null ||
    input.resellerName !== null ||
    input.packagingCost > 0 ||
    input.laborMinutes > 0;

  if (hasCost) {
    const { error } = await supabase.from('product_costs').upsert(
      {
        product_id: productId,
        reseller_name: input.resellerName,
        cost_price: input.costPrice,
        packaging_cost: input.packagingCost,
        labor_minutes: input.laborMinutes,
      },
      { onConflict: 'product_id' }
    );
    if (error) {
      // Saat membuat produk baru, batalkan produk yang baru dibuat agar tidak setengah jadi.
      if (isCreate) await supabase.from('products').delete().eq('id', productId);
      return {
        status: 'error',
        message: `Data biaya gagal disimpan: ${getAdminErrorMessage(error.message)}`,
      };
    }
  } else if (!isCreate) {
    await supabase.from('product_costs').delete().eq('product_id', productId);
  }

  // Hapus file gambar lama yang tidak dipakai lagi (upaya terbaik).
  const keptPaths = new Set([...(input.imagePath ? [input.imagePath] : []), ...input.galleryPaths]);
  const removable = previousPaths.filter((path) => !keptPaths.has(path));
  if (removable.length > 0) {
    await supabase.storage.from(ASSET_BUCKET).remove(removable);
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin/products');
}

/** Produk tidak pernah dihapus permanen: hanya diaktifkan atau dinonaktifkan. */
export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID_REGEX.test(productId)) return { ok: false, error: 'ID produk tidak valid.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select('id');
  if (error) return { ok: false, error: getAdminErrorMessage(error.message) };
  if (!data || data.length === 0) return { ok: false, error: 'Produk tidak ditemukan.' };

  revalidatePath('/admin', 'layout');
  return { ok: true, message: isActive ? 'Produk diaktifkan.' : 'Produk dinonaktifkan.' };
}