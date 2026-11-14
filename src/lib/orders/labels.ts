import type { Tone } from '@/lib/admin/labels';
import type { OrderStatus, PaymentMethod, VerificationStatus } from '@/types/domain';

export interface BuyerStatusMeta {
  label: string;
  tone: Tone;
}

export const BUYER_ORDER_STATUS: Record<OrderStatus, BuyerStatusMeta> = {
  awaiting_payment: { label: 'Menunggu pembayaran', tone: 'neutral' },
  awaiting_verification: { label: 'Menunggu konfirmasi admin', tone: 'orange' },
  processing: { label: 'Pesanan diproses', tone: 'blue' },
  ready: { label: 'Siap diantar', tone: 'blue' },
  delivering: { label: 'Sedang diantar', tone: 'blue' },
  completed: { label: 'Selesai', tone: 'green' },
  cancelled: { label: 'Dibatalkan', tone: 'red' },
};

export function getPaymentStatusText(method: PaymentMethod, status: VerificationStatus): string {
  if (method === 'cod') {
    return status === 'verified' ? 'Pesanan dikonfirmasi admin' : 'Menunggu konfirmasi admin';
  }
  switch (status) {
    case 'awaiting_proof':
      return 'Menunggu bukti transfer';
    case 'awaiting_review':
      return 'Bukti diterima, menunggu konfirmasi admin';
    case 'verified':
      return 'Pembayaran terverifikasi';
    case 'rejected':
      return 'Bukti ditolak admin, silakan unggah ulang';
  }
}

export interface TimelineStep {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming';
}

const STATUS_INDEX: Record<OrderStatus, number> = {
  awaiting_payment: 0,
  awaiting_verification: 1,
  processing: 2,
  ready: 3,
  delivering: 4,
  completed: 5,
  cancelled: -1,
};

/** Enam tahap pesanan. "Siap diantar" opsional: bila dilewati admin, tahap itu tetap tampil selesai. */
export function buildTimeline(status: OrderStatus, method: PaymentMethod): TimelineStep[] {
  const labels =
    method === 'cod'
      ? ['Pesanan dibuat', 'Konfirmasi admin', 'Diproses', 'Siap diantar', 'Diantar', 'Selesai']
      : ['Menunggu pembayaran', 'Verifikasi pembayaran', 'Diproses', 'Siap diantar', 'Diantar', 'Selesai'];
  const currentIndex = STATUS_INDEX[status];

  return labels.map((label, index) => {
    let state: TimelineStep['state'] = 'upcoming';
    if (status === 'completed' || index < currentIndex) state = 'done';
    else if (index === currentIndex) state = 'current';
    return { key: `${index}-${label}`, label, state };
  });
}