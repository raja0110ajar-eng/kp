'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, FormState } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { UUID_REGEX, parseProductForm } from '@/lib/admin/validation';

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
  let productId: string;
  let previousImagePath: string | null = null;
  const isCreate = input.id === null;

  if (input.id === null) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: input.slug,
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        product_type: input.productType,
        is_active: input.isActive,
        image_path: input.imagePath,
      })
      .select('id')
      .single();
    if (error || !data) {
      return { status: 'error', message: getAdminErrorMessage(error?.message ?? 'unknown') };
    }
    productId = (data as { id: string }).id;
  } else {
    const { data: current, error: readError } = await supabase
      .from('products')
      .select('image_path')
      .eq('id', input.id)
      .maybeSingle();
    if (readError) return { status: 'error', message: getAdminErrorMessage(readError.message) };
    if (!current) return { status: 'error', message: 'Produk tidak ditemukan.' };
    previousImagePath = (current as { image_path: string | null }).image_path;

    const { error } = await supabase
      .from('products')
      .update({
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        product_type: input.productType,
        is_active: input.isActive,
        image_path: input.imagePath,
      })
      .eq('id', input.id);
    if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };
    productId = input.id;
  }

  if (input.productType === 'reseller') {
    const { error } = await supabase
      .from('product_costs')
      .upsert(
        { product_id: productId, reseller_name: input.resellerName, cost_price: input.costPrice },
        { onConflict: 'product_id' }
      );
    if (error) {
      // Saat membuat produk baru, batalkan produk yang baru dibuat agar tidak setengah jadi.
      if (isCreate) await supabase.from('products').delete().eq('id', productId);
      return {
        status: 'error',
        message: `Data reseller gagal disimpan: ${getAdminErrorMessage(error.message)}`,
      };
    }
  }

  // Hapus file gambar lama bila diganti/dihapus (upaya terbaik, kegagalannya tidak menghentikan simpan).
  if (previousImagePath && previousImagePath !== input.imagePath) {
    await supabase.storage.from(ASSET_BUCKET).remove([previousImagePath]);
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