'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { PaymentDestination } from '@/components/checkout/PaymentDestination';
import { PaymentNextSteps } from '@/components/checkout/PaymentNextSteps';
import { ProofUploader } from '@/components/checkout/ProofUploader';
import { OrderCodeCard } from '@/components/orders/OrderCodeCard';
import { formatRupiah } from '@/lib/format';
import { trackOrder } from '@/lib/orders/api';
import { getOrderErrorMessage } from '@/lib/orders/errors';
import { formatOrderCode } from '@/lib/orders/order-code';
import { recallOrderPhone, rememberOrderPhone } from '@/lib/orders/order-session';
import type { PaymentSetting } from '@/types/catalog';
import type { PaymentMethod, TrackedOrder, VerificationStatus } from '@/types/domain';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'need-phone'; error: string | null }
  | { kind: 'ready'; order: TrackedOrder; phone: string };

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: 'COD (bayar tunai)',
  qris: 'QRIS',
  dana: 'DANA',
  ovo: 'OVO',
  gopay: 'GoPay',
  bank_transfer: 'Transfer bank',
};

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  awaiting_proof: 'Menunggu bukti transfer',
  awaiting_review: 'Menunggu konfirmasi admin',
  verified: 'Pembayaran terverifikasi',
  rejected: 'Bukti ditolak admin, silakan unggah ulang',
};

interface PayOrderClientProps {
  orderCode: string;
  paymentSettings: PaymentSetting[];
}

export function PayOrderClient({ orderCode, paymentSettings }: PayOrderClientProps) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [phoneInput, setPhoneInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mengembalikan pesan error (string) atau null jika sukses.
  const load = useCallback(
    async (phone: string): Promise<string | null> => {
      try {
        const order = await trackOrder(orderCode, phone);
        if (!order) return 'Kode pesanan dan nomor HP tidak cocok.';
        rememberOrderPhone(orderCode, phone);
        setView({ kind: 'ready', order, phone });
        return null;
      } catch (error) {
        return getOrderErrorMessage(error instanceof Error ? error.message : 'unknown');
      }
    },
    [orderCode]
  );

  useEffect(() => {
    const saved = recallOrderPhone(orderCode);
    if (!saved) {
      setView({ kind: 'need-phone', error: null });
      return;
    }
    void load(saved).then((error) => {
      if (error) setView({ kind: 'need-phone', error });
    });
  }, [orderCode, load]);

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const error = await load(phoneInput);
    if (error) setView({ kind: 'need-phone', error });
    setSubmitting(false);
  }

  if (view.kind === 'loading') {
    return (
      <p className="flex items-center gap-2 text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memuat pesanan…
      </p>
    );
  }

  if (view.kind === 'need-phone') {
    return (
      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold">Pesanan {formatOrderCode(orderCode.toUpperCase())}</h1>
        <p className="text-sm text-muted">Masukkan nomor HP yang kamu pakai saat checkout.</p>
        <input
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          aria-label="Nomor HP"
          value={phoneInput}
          onChange={(event) => setPhoneInput(event.target.value)}
          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-3 text-base text-ink focus:border-primary"
        />
        {view.error ? <p className="text-sm text-danger-ink">{view.error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Lanjutkan
        </button>
      </form>
    );
  }

  const { order, phone } = view;
  const { payment } = order;
  const destination = paymentSettings.find((setting) => setting.method === payment.method) ?? null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Pesanan {formatOrderCode(order.order_code)}</h1>
        <p className="text-sm text-muted">
          {METHOD_LABEL[payment.method]} · Total {formatRupiah(order.total)} ·{' '}
          {VERIFICATION_LABEL[payment.verification_status]}
        </p>
        <Link
          href={`/orders/${order.order_code}`}
          className="mt-1 inline-block text-sm font-semibold text-link underline"
        >
          Lihat status pesanan
        </Link>
      </header>

      <OrderCodeCard orderCode={order.order_code} />

      {payment.verification_status === 'rejected' && payment.admin_note ? (
        <p className="rounded-lg bg-soft p-3 text-sm text-accent-ink">
          Catatan admin: {payment.admin_note}
        </p>
      ) : null}

      {order.status === 'cancelled' ? (
        <p className="text-ink-soft">Pesanan ini sudah dibatalkan.</p>
      ) : payment.method === 'cod' ? (
        <p className="text-ink-soft">
          Pesanan COD tidak perlu bukti transfer. Siapkan uang tunai saat pesanan diantar, admin akan
          mengonfirmasi pesananmu.
        </p>
      ) : payment.verification_status === 'verified' ? (
        <p className="text-ink-soft">Pembayaran sudah terverifikasi. Pesananmu sedang diproses.</p>
      ) : (
        <>
          <PaymentNextSteps expectedAmount={payment.expected_amount} />
          {destination ? (
            <PaymentDestination setting={destination} />
          ) : (
            <p className="rounded-lg bg-soft p-3 text-sm text-accent-ink">
              Tujuan pembayaran untuk metode ini belum bisa ditampilkan. Hubungi admin Karsa Pandiga
              dengan menyebutkan kode pesananmu.
            </p>
          )}
          <ProofUploader
            orderId={order.order_id}
            orderCode={order.order_code}
            phone={phone}
            expectedAmount={payment.expected_amount}
            onSubmitted={() => {
              void load(phone);
            }}
          />
        </>
      )}
    </div>
  );
}