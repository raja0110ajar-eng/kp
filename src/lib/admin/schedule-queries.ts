import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';

export interface OrderSchedule {
  etaDate: string | null;
  etaNote: string | null;
  customerNote: string | null;
  scheduleUpdatedAt: string | null;
}

export async function getOrderSchedule(orderId: string): Promise<OrderSchedule> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('eta_date, eta_note, customer_note, schedule_updated_at')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat jadwal: ${error.message}`);

  const row = data as {
    eta_date: string | null;
    eta_note: string | null;
    customer_note: string | null;
    schedule_updated_at: string | null;
  } | null;

  return {
    etaDate: row?.eta_date ?? null,
    etaNote: row?.eta_note ?? null,
    customerNote: row?.customer_note ?? null,
    scheduleUpdatedAt: row?.schedule_updated_at ?? null,
  };
}  