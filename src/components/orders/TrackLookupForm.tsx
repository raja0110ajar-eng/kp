'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import { getOrderErrorMessage } from '@/lib/orders/errors';
import { ORDER_CODE_REGEX, normalizeOrderCode } from '@/lib/orders/order-code';
import { rememberOrderPhone } from '@/lib/orders/order-session';
import { trackOrderDetail } from '@/lib/orders/track-detail';
import { isValidPhone, normalizePhone } from '@/lib/phone';

const inputClass =
  'mt-1 w-full rounded-lg border border-line-strong px-3 py-2 focus:border-primary';

export function TrackLookupForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const orderCode = normalizeOrderCode(code);
    if (!ORDER_CODE_REGEX.test(orderCode)) {
      setError('Format kode pesanan tidak valid. Contoh: KP-1A2B3C4D5E.');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('Nomor HP tidak valid. Gunakan nomor seluler Indonesia, contoh 081234567890.');
      return;
    }

    setError(null);
    setSubmitting(true);
    const normalizedPhone = normalizePhone(phone);

    try {
      const order = await trackOrderDetail(orderCode, normalizedPhone);
      if (!order) {
        setError('Kode pesanan dan nomor HP tidak cocok.');
        setSubmitting(false);
        return;
      }
      rememberOrderPhone(orderCode, normalizedPhone);
      router.push(`/orders/${orderCode}`);
    } catch (lookupError) {
      setError(getOrderErrorMessage(lookupError instanceof Error ? lookupError.message : 'unknown'));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <div>
        <h2 className="text-lg font-bold">Lacak dengan kode pesanan</h2>
        <p className="text-sm text-muted">
          Kode pesanan ada di halaman setelah checkout. Nomor HP harus sama dengan yang kamu isi saat
          checkout.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Kode pesanan
          <input
            type="text"
            required
            maxLength={20}
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Nomor HP
          <input
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error ? (
        <p className="flex items-start gap-2 text-sm text-accent-ink" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Search className="h-4 w-4" aria-hidden />
        )}
        Lacak pesanan
      </button>
    </form>
  );
}