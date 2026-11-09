'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { OrderStatusView } from '@/components/orders/OrderStatusView';
import { getOrderErrorMessage } from '@/lib/orders/errors';
import { recallOrderPhone, rememberOrderPhone } from '@/lib/orders/order-session';
import { trackOrderDetail } from '@/lib/orders/track-detail';
import { normalizePhone } from '@/lib/phone';
import type { TrackedOrderDetail } from '@/types/tracking';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'need-phone'; error: string | null }
  | { kind: 'ready'; order: TrackedOrderDetail; phone: string };

const POLL_INTERVAL_MS = 30_000;

export function GuestOrderTracker({ orderCode }: { orderCode: string }) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [phoneInput, setPhoneInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mengembalikan pesan error (string) atau null jika sukses.
  const load = useCallback(
    async (phone: string): Promise<string | null> => {
      try {
        const order = await trackOrderDetail(orderCode, phone);
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

  const readyPhone = view.kind === 'ready' ? view.phone : null;

  // Perbarui status otomatis tiap 30 detik, hanya saat tab terlihat.
  useEffect(() => {
    if (!readyPhone) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load(readyPhone);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [readyPhone, load]);

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const error = await load(normalizePhone(phoneInput));
    if (error) setView({ kind: 'need-phone', error });
    setSubmitting(false);
  }

  async function handleRefresh() {
    if (!readyPhone) return;
    setRefreshing(true);
    await load(readyPhone);
    setRefreshing(false);
  }

  if (view.kind === 'loading') {
    return (
      <p className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memuat pesanan…
      </p>
    );
  }

  if (view.kind === 'need-phone') {
    return (
      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Pesanan {orderCode}</h1>
        <p className="text-sm text-neutral-600">Masukkan nomor HP yang kamu pakai saat checkout.</p>
        <input
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          aria-label="Nomor HP"
          value={phoneInput}
          onChange={(event) => setPhoneInput(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#0066FF]"
        />
        {view.error ? <p className="text-sm text-[#FF6B00]">{view.error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 font-semibold text-white transition hover:bg-[#1A73E8] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Lihat pesanan
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <span className="hidden text-xs text-neutral-500 sm:inline">
          Diperbarui otomatis tiap {POLL_INTERVAL_MS / 1000} detik
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          Muat ulang
        </button>
      </div>
      <OrderStatusView order={view.order} />
    </div>
  );
}