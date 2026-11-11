'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { parseCategoryForm } from '@/lib/admin/validation-extra';
import { slugify } from '@/lib/slugify';

export async function saveCategoryAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return { status: 'error', message: parsed.error };
  const input = parsed.value;

  const supabase = await createClient();

  if (input.id === null) {
    const slug = slugify(input.name, 60);
    if (slug === '') {
      return { status: 'error', message: 'Nama kategori harus memuat huruf atau angka.' };
    }
    const { error } = await supabase.from('categories').insert({
      name: input.name,
      slug,
      sort_order: input.sortOrder,
      is_active: input.isActive,
    });
    if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };
  } else {
    // Slug terkunci setelah dibuat agar tautan filter tidak putus.
    const { data, error } = await supabase
      .from('categories')
      .update({ name: input.name, sort_order: input.sortOrder, is_active: input.isActive })
      .eq('id', input.id)
      .select('id');
    if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };
    if (!data || data.length === 0) return { status: 'error', message: 'Kategori tidak ditemukan.' };
  }

  revalidatePath('/admin', 'layout');
  return { status: 'success', message: 'Kategori tersimpan.' };
}