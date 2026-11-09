'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { parsePaymentSettingForm } from '@/lib/admin/validation';

const ASSET_BUCKET = 'public-assets';

export async function savePaymentSettingAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = parsePaymentSettingForm(formData);
  if (!parsed.ok) return { status: 'error', message: parsed.error };
  const input = parsed.value;

  const supabase = await createClient();

  let previousQrisPath: string | null = null;
  if (input.method === 'qris') {
    const { data } = await supabase
      .from('payment_settings')
      .select('qris_image_path')
      .eq('method', 'qris')
      .maybeSingle();
    previousQrisPath = (data as { qris_image_path: string | null } | null)?.qris_image_path ?? null;
  }

  // Aturan "lengkap sebelum aktif" dijaga constraint database; pesan errornya diterjemahkan di sini.
  const { error } = await supabase.from('payment_settings').upsert(
    {
      method: input.method,
      is_active: input.isActive,
      display_name: input.displayName,
      account_name: input.accountName,
      account_number: input.accountNumber,
      instructions: input.instructions,
      qris_image_path: input.qrisImagePath,
      sort_order: input.sortOrder,
    },
    { onConflict: 'method' }
  );
  if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };

  if (previousQrisPath && previousQrisPath !== input.qrisImagePath) {
    await supabase.storage.from(ASSET_BUCKET).remove([previousQrisPath]);
  }

  revalidatePath('/admin', 'layout');
  return { status: 'success', message: 'Setelan tersimpan.' };
}