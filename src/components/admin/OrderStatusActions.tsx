'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/admin/styles';
import { setOrderStatusAction } from '@/lib/admin/actions/orders';
import type { OrderStatus } from '@/types/domain';

interface StatusStep {
  to: string;
  label: string;
  kind: 'primary' | 'secondary';
  /** Bila ada, admin harus mengonfirmasi dulu. */
  confirm?: string;
}

const FORWARD: Partial<Record<OrderStatus, readonly StatusStep[]>> = {
  processing: [
    { to: 'ready', label: 'Tandai siap diantar', kind: 'primary' },
    { to: 'delivering', label: 'Tandai sedang diantar', kind: 'secondary' },
    {
      to: 'completed',
      label: 'Langsung selesai',
      kind: 'secondary',
      confirm: 'Tandai pesanan langsung selesai tanpa melewati tahap Siap diantar dan Diantar?',
    },
  ],
  ready: [
    { to: 'delivering', label: 'Tandai sedang diantar', kind: 'primary' },
    {
      to: 'completed',
      label: 'Langsung selesai',
      kind: 'secondary',
      confirm: 'Tandai pesanan langsung selesai tanpa melewati tahap Diantar?',
    },
  ],
  delivering: [{ to: 'completed', label: 'Tandai selesai', kind: 'primary' }],
};

const BACKWARD: Partial<Record<OrderStatus, readonly StatusStep[]>> = {
  ready: [
    {
      to: 'processing',
      label: 'Mundur ke Diproses',
      kind: 'secondary',
      confirm: 'Kembalikan status pesanan ke Diproses?',
    },
  ],
  delivering: [
    {
      to: 'ready',
      label: 'Mundur ke Siap diantar',
      kind: 'secondary',
      confirm: 'Kembalikan status pesanan ke Siap diantar?',
    },
    {
      to: 'processing',
      label: 'Mundur ke Diproses',
      kind: 'secondary',
      confirm: 'Kembalikan status pesanan ke Diproses?',
    },
  ],
};

interface PendingConfirm {
  to: string;
  text: string;
  danger: boolean;
}

export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [confirming, setConfirming] = useState<PendingConfirm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === 'completed' || status === 'cancelled') {
    return <p className="text-sm text-muted">Status akhir, tidak bisa diubah lagi.</p>;
  }

  const forward = FORWARD[status] ?? [];
  const backward = BACKWARD[status] ?? [];

  function run(target: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await setOrderStatusAction(orderId, target);
      if (result.ok) {
        setMessage(result.message);
        setConfirming(null);
      } else {
        setError(result.error);
      }
    });
  }

  function choose(step: StatusStep) {
    if (step.confirm) setConfirming({ to: step.to, text: step.confirm, danger: false });
    else run(step.to);
  }

  return (
    <div className="space-y-3">
      {forward.length === 0 ? (
        <p className="text-sm text-muted">
          Verifikasi pembayaran dulu di antrean verifikasi sebelum pesanan bisa diproses.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {forward.map((step) => (
            <button
              key={step.to}
              type="button"
              disabled={pending}
              onClick={() => choose(step)}
              className={step.kind === 'primary' ? primaryButtonClass : secondaryButtonClass}
            >
              {pending && step.kind === 'primary' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {step.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {backward.map((step) => (
          <button
            key={step.to}
            type="button"
            disabled={pending}
            onClick={() => choose(step)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted underline-offset-4 hover:underline disabled:opacity-50"
          >
            {step.label}
          </button>
        ))}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            setConfirming({
              to: 'cancelled',
              text: 'Yakin membatalkan pesanan ini? Jika pembayarannya sudah terverifikasi, stok produk dikembalikan otomatis. Pembatalan tidak bisa diurungkan.',
              danger: true,
            })
          }
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-danger-ink underline-offset-4 hover:underline disabled:opacity-50"
        >
          Batalkan pesanan
        </button>
      </div>

      {confirming ? (
        <div
          className={`space-y-3 rounded-xl border p-4 ${
            confirming.danger ? 'border-accent bg-accent/5' : 'border-primary bg-primary/5'
          }`}
        >
          <p className="text-sm">{confirming.text}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run(confirming.to)}
              disabled={pending}
              className={confirming.danger ? dangerButtonClass : primaryButtonClass}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Ya, lanjutkan
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={pending}
              className={secondaryButtonClass}
            >
              Kembali
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm font-semibold text-success-ink">{message}</p> : null}
      {error ? (
        <p className="flex items-start gap-2 text-sm text-danger-ink" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
}