'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, FormState } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { UUID_REGEX, readText } from '@/lib/admin/validation';

const ALLOWED_TARGETS = ['processing', 'ready', 'delivering', 'completed', 'cancelled'] as const;
type AllowedTarget = (typeof ALLOWED_TARGETS)[number];

export async function setOrderStatusAction(orderId: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID_REGEX.test(orderId)) return { ok: false, error: 'ID pesanan tidak valid.' };

  const target = ALLOWED_TARGETS.find((candidate): candidate is AllowedTarget => candidate === status);
  if (!target) return { ok: false, error: 'Status yang dipilih tidak diizinkan.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_set_order_status', {
    p_order_id: orderId,
    p_status: target,
  });
  if (error) return { ok: false, error: getAdminErrorMessage(error.message) };

  revalidatePath('/admin', 'layout');
  return {
    ok: true,
    message: target === 'cancelled' ? 'Pesanan dibatalkan.' : 'Status pesanan diperbarui.',
  };
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Jadwal dan catatan yang dilihat pembeli. Bisa diubah kapan pun selama pesanan belum final. */
export async function updateScheduleAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const orderId = readText(formData, 'order_id');
  if (!UUID_REGEX.test(orderId)) return { status: 'error', message: 'ID pesanan tidak valid.' };

  const etaDate = readText(formData, 'eta_date');
  if (etaDate !== '' && !isRealDate(etaDate)) {
    return { status: 'error', message: 'Tanggal perkiraan tidak valid.' };
  }

  const etaNote = readText(formData, 'eta_note');
  if (etaNote.length > 200) {
    return { status: 'error', message: 'Keterangan waktu maksimal 200 karakter.' };
  }
  const customerNote = readText(formData, 'customer_note');
  if (customerNote.length > 300) {
    return { status: 'error', message: 'Catatan untuk pembeli maksimal 300 karakter.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_update_schedule', {
    p_order_id: orderId,
    p_eta_date: etaDate === '' ? null : etaDate,
    p_eta_note: etaNote,
    p_customer_note: customerNote,
  });
  if (error) return { status: 'error', message: getAdminErrorMessage(error.message) };

  revalidatePath('/admin', 'layout');
  return { status: 'success', message: 'Jadwal tersimpan. Pembeli melihatnya di halaman pesanan.' };
}