'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/admin/action-result';
import { getAdminErrorMessage } from '@/lib/admin/errors';
import { UUID_REGEX } from '@/lib/admin/validation';

const STATUSES = ['pending', 'approved', 'rejected'] as const;
type ReviewStatus = (typeof STATUSES)[number];

export async function setReviewStatusAction(reviewId: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID_REGEX.test(reviewId)) return { ok: false, error: 'ID ulasan tidak valid.' };

  const target = STATUSES.find((candidate): candidate is ReviewStatus => candidate === status);
  if (!target) return { ok: false, error: 'Status tidak valid.' };

  const supabase = await createClient();
  // Ulasan yang tidak disetujui otomatis dilepas dari sorotan beranda.
  const { data, error } = await supabase
    .from('reviews')
    .update(target === 'approved' ? { status: target } : { status: target, is_featured: false })
    .eq('id', reviewId)
    .select('id');
  if (error) return { ok: false, error: getAdminErrorMessage(error.message) };
  if (!data || data.length === 0) return { ok: false, error: 'Ulasan tidak ditemukan.' };

  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'Status ulasan diperbarui.' };
}

export async function toggleReviewFeaturedAction(
  reviewId: string,
  featured: boolean
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID_REGEX.test(reviewId)) return { ok: false, error: 'ID ulasan tidak valid.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_featured: featured })
    .eq('id', reviewId)
    .select('id');
  if (error) return { ok: false, error: getAdminErrorMessage(error.message) };
  if (!data || data.length === 0) return { ok: false, error: 'Ulasan tidak ditemukan.' };

  revalidatePath('/admin', 'layout');
  return { ok: true, message: featured ? 'Ulasan disorot di beranda.' : 'Sorotan dilepas.' };
}