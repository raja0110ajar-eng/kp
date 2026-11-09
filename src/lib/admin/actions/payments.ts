'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { UUID_REGEX } from '@/lib/admin/validation';

/** Verifikasi pembayaran (non-COD) atau konfirmasi pesanan (COD). Stok berkurang di database. */
export async function verifyPaymentAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID_REGEX.test(paymentId)) return { ok: false, error: 'ID pembayaran tidak valid.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_verify_payment', { p_payment_id: paymentId });
  if (error) return { ok: false, error: getAdminErrorMessage(error.message) };

  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'Berhasil. Stok sudah dikurangi dan pesanan masuk status Diproses.' };
}

export async function rejectPaymentAction(paymentId: string, note: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID_REGEX.test(paymentId)) return { ok: false, error: 'ID pembayaran tidak valid.' };

  const trimmed = note.trim();
  if (trimmed.length < 1 || trimmed.length > 300) {
    return { ok: false, error: 'Catatan penolakan wajib diisi (maksimal 300 karakter).' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_reject_payment', {
    p_payment_id: paymentId,
    p_note: trimmed,
  });
  if (error) return { ok: false, error: getAdminErrorMessage(error.message) };

  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'Pembayaran ditolak.' };
}