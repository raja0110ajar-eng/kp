'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/styles';
import { setOrderStatusAction } from '@/lib/admin/actions/orders';
import type { OrderStatus } from '@/types/domain';

interface OrderStatusActionsProps {
  orderId: string;
  status: OrderStatus;
}

const NEXT_STEP: Partial<Record<OrderStatus, { to: 'delivering' | 'completed'; label: string }>> = {
  processing: { to: 'delivering', label: 'Tandai sedang diantar' },
  delivering: { to: 'completed', label: 'Tandai selesai' },
};

export function OrderStatusActions({ orderId, status }: OrderStatusActionsProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === 'completed' || status === 'cancelled') {
    return <p className="text-sm text-neutral-600">Status akhir, tidak bisa diubah lagi.</p>;
  }

  const nextStep = NEXT_STEP[status];

  function run(target: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await setOrderStatusAction(orderId, target);
      if (result.ok) {
        setMessage(result.message);
        setConfirmCancel(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      {!nextStep ? (
        <p className="text-sm text-neutral-600">
          Verifikasi pembayaran dulu di antrean verifikasi sebelum pesanan bisa diantar.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {nextStep ? (
          <button
            type="button"
            onClick={() => run(nextStep.to)}
            disabled={pending}
            className={primaryButtonClass}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {nextStep.label}
          </button>
        ) : null}
        {!confirmCancel ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            disabled={pending}
            className={secondaryButtonClass}
          >
            Batalkan pesanan
          </button>
        ) : null}
      </div>

      {confirmCancel ? (
        <div className="space-y-3 rounded-xl border border-[#FF6B00] bg-[#FF6B00]/5 p-4">
          <p className="text-sm">
            Yakin membatalkan pesanan ini? Jika pembayarannya sudah terverifikasi, stok produk
            dikembalikan otomatis. Pembatalan tidak bisa diurungkan.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run('cancelled')}
              disabled={pending}
              className={dangerButtonClass}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Ya, batalkan
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              disabled={pending}
              className={secondaryButtonClass}
            >
              Kembali
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? (
        <p className="flex items-start gap-2 text-sm text-[#FF6B00]" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
}