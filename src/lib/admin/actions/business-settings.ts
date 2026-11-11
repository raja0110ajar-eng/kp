'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { parseBusinessSettingsForm } from '@/lib/admin/validation-extra';

export async function saveBusinessSettingsAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = parseBusinessSettingsForm(formData);
  if (!parsed.ok) return { status: 'error', message: parsed.error };
  const input = parsed.value;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_settings')
    .update({
      labor_rate_per_hour: input.laborRatePerHour,
      delivery_cost_school: input.deliveryCostSchool,
      delivery_cost_outside: input.deliveryCostOutside,
    })
    .eq('id', true)
    .select('id');
  if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };
  if (!data || data.length === 0) {
    return { status: 'error', message: 'Baris pengaturan belum ada. Jalankan migrasi 0006.' };
  }

  revalidatePath('/admin', 'layout');
  return {
    status: 'success',
    message: 'Asumsi biaya tersimpan. HPP pesanan yang sudah terverifikasi tidak berubah.',
  };
}