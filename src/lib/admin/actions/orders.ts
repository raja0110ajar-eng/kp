'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { UUID_REGEX } from '@/lib/admin/validation';

const ALLOWED_TARGETS = ['delivering', 'completed', 'cancelled'] as const;
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