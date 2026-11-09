import { createClient } from '@/lib/supabase/client';
import type { TrackedOrderDetail } from '@/types/tracking';

export async function trackOrderDetail(
  orderCode: string,
  phone: string
): Promise<TrackedOrderDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('track_order', {
    p_order_code: orderCode,
    p_phone: phone,
  });
  if (error) throw new Error(error.message);
  return (data as TrackedOrderDetail | null) ?? null;
}