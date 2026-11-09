'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { parseZoneForm } from '@/lib/admin/validation';

export async function saveZoneAction(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseZoneForm(formData);
  if (!parsed.ok) return { status: 'error', message: parsed.error };
  const input = parsed.value;

  const supabase = await createClient();
  const payload = {
    name: input.name,
    fee: input.fee,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };

  if (input.id === null) {
    const { error } = await supabase.from('shipping_zones').insert(payload);
    if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };
  } else {
    const { data, error } = await supabase
      .from('shipping_zones')
      .update(payload)
      .eq('id', input.id)
      .select('id');
    if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };
    if (!data || data.length === 0) return { status: 'error', message: 'Zona tidak ditemukan.' };
  }

  revalidatePath('/admin', 'layout');
  return { status: 'success', message: 'Zona tersimpan. Perubahan langsung berlaku di checkout.' };
}