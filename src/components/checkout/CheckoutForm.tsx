'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { buildCartLines } from '@/lib/cart/cart-lines';
import { useCart } from '@/lib/cart/cart-store';
import { useCartProducts } from '@/lib/cart/use-cart-products';
import { formatRupiah } from '@/lib/format';
import { createOrder } from '@/lib/orders/api';
import { getOrderErrorMessage } from '@/lib/orders/errors';
import { rememberOrderPhone } from '@/lib/orders/order-session';
import { isValidPhone, normalizePhone } from '@/lib/phone';
import type { PaymentSetting, ShippingZone } from '@/types/catalog';
import type { DeliveryArea, PaymentMethod } from '@/types/domain';

type FieldKey = 'name' | 'phone' | 'zone' | 'address' | 'method';
type FieldErrors = Partial<Record<FieldKey, string>>;

interface PaymentOption {
  method: PaymentMethod;
  label: string;
  hint: string;
}

interface CheckoutFormProps {
  zones: ShippingZone[];
  paymentSettings: PaymentSetting[];
}

const FIELD_IDS: Record<FieldKey, string> = {
  name: 'field-name',
  phone: 'field-phone',
  zone: 'field-zone',
  address: 'field-address',
  method: 'field-method',
};

const STEPS = [
  { id: 'langkah-data', label: 'Data' },
  { id: 'langkah-pengiriman', label: 'Pengiriman' },
  { id: 'langkah-pembayaran', label: 'Pembayaran' },
] as const;

function inputClass(hasError: boolean): string {
  return `mt-1 w-full rounded-lg border bg-surface px-3 py-3 text-base text-ink focus:border-primary ${
    hasError ? 'border-danger-ink' : 'border-line-strong'
  }`;
}

function choiceClass(selected: boolean, disabled = false): string {
  const base = 'flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 transition';
  if (disabled) return `${base} cursor-not-allowed border-line opacity-50`;
  return selected
    ? `${base} border-primary bg-primary/5`
    : `${base} border-line hover:border-line-strong`;
}

function validateFields(input: {
  name: string;
  phone: string;
  area: DeliveryArea;
  zoneId: string;
  address: string;
  method: PaymentMethod | '';
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.trim().length === 0) errors.name = 'Nama wajib diisi.';
  if (!isValidPhone(input.phone)) {
    errors.phone = 'Gunakan nomor seluler Indonesia, contoh 081234567890.';
  }
  if (input.area === 'outside' && input.zoneId === '') errors.zone = 'Pilih zona pengiriman.';
  if (input.address.trim().length === 0) errors.address = 'Alamat atau lokasi pengantaran wajib diisi.';
  if (input.method === '') errors.method = 'Pilih metode pembayaran.';
  return errors;
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function OrderSummary({
  lines,
  subtotal,
  shipping,
  total,
}: {
  lines: ReadonlyArray<{ id: string; name: string; quantity: number; lineTotal: number }>;
  subtotal: number;
  shipping: number;
  total: number;
}) {
  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-sm">
        {lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-3">
            <span>
              {line.name} × {line.quantity}
            </span>
            <span className="font-medium">{formatRupiah(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t border-line pt-3 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatRupiah(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Ongkir</dt>
          <dd>{shipping === 0 ? 'Gratis' : formatRupiah(shipping)}</dd>
        </div>
        <div className="flex justify-between pt-2 text-base font-extrabold">
          <dt>Total (estimasi)</dt>
          <dd>{formatRupiah(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function CheckoutForm({ zones, paymentSettings }: CheckoutFormProps) {
  const router = useRouter();
  const cart = useCart();
  const productsState = useCartProducts(cart.items);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState<DeliveryArea>('school');
  const [zoneId, setZoneId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const built = useMemo(
    () =>
      productsState.status === 'ready' ? buildCartLines(cart.items, productsState.products) : null,
    [cart.items, productsState]
  );

  const paymentOptions = useMemo<PaymentOption[]>(
    () => [
      ...paymentSettings.map((setting) => ({
        method: setting.method as PaymentMethod,
        label: setting.display_name,
        hint:
          setting.method === 'qris'
            ? 'Scan QRIS lalu unggah bukti transfer'
            : 'Transfer lalu unggah bukti transfer',
      })),
      { method: 'cod', label: 'COD (bayar tunai)', hint: 'Bayar tunai saat pesanan diterima' },
    ],
    [paymentSettings]
  );

  if (redirecting) {
    return (
      <p className="flex items-center gap-2 text-muted" aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Pesanan dibuat, mengalihkan…
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl bg-soft p-10 text-center">
        <p className="text-ink-soft">Keranjangmu kosong, belum ada yang bisa di-checkout.</p>
        <Link
          href="/products"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-white transition hover:bg-primary-hover"
        >
          Lihat katalog
        </Link>
      </div>
    );
  }

  if (productsState.status === 'loading') {
    return (
      <p className="flex items-center gap-2 text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memuat keranjang…
      </p>
    );
  }

  if (productsState.status === 'error' || !built) {
    return (
      <p className="flex items-center gap-2 text-accent-ink" role="alert">
        <AlertTriangle className="h-4 w-4" aria-hidden /> Gagal memuat keranjang. Muat ulang halaman.
      </p>
    );
  }

  if (built.blocked.length > 0 || built.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-accent bg-accent/5 p-6">
        <p className="text-ink-soft">
          Ada produk di keranjang yang habis atau sudah tidak tersedia. Rapikan keranjang dulu sebelum
          checkout.
        </p>
        <Link
          href="/cart"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-white transition hover:bg-primary-hover"
        >
          Kembali ke keranjang
        </Link>
      </div>
    );
  }

  const fieldErrors = validateFields({ name, phone, area, zoneId, address, method });
  const visibleError = (key: FieldKey): string | undefined =>
    touched[key] || submitAttempted ? fieldErrors[key] : undefined;
  const touch = (key: FieldKey) => setTouched((current) => ({ ...current, [key]: true }));

  const stepDone = [
    !fieldErrors.name && !fieldErrors.phone,
    !fieldErrors.address && !fieldErrors.zone,
    !fieldErrors.method,
  ];
  const currentStep = stepDone.findIndex((done) => !done);

  const selectedZone = zones.find((zone) => zone.id === zoneId) ?? null;
  const shippingEstimate = area === 'outside' && selectedZone ? selectedZone.fee : 0;
  const totalEstimate = built.subtotal + shippingEstimate;
  const outsideAvailable = zones.length > 0;
  const longestLeadTime = built.lines.reduce(
    (longest, line) => Math.max(longest, line.product.lead_time_days),
    0
  );
  const summaryLines = built.lines.map((line) => ({
    id: line.product.id,
    name: line.product.name,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !built || method === '') {
      setSubmitAttempted(true);
      return;
    }

    const firstInvalid = (Object.keys(fieldErrors) as FieldKey[])[0];
    if (firstInvalid) {
      setSubmitAttempted(true);
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    setError(null);
    setSubmitting(true);

    const normalizedPhone = normalizePhone(phone);
    try {
      const result = await createOrder({
        customerName: name.trim(),
        customerPhone: normalizedPhone,
        deliveryArea: area,
        shippingZoneId: area === 'outside' ? zoneId : null,
        deliveryAddress: address.trim(),
        paymentMethod: method,
        notes: notes.trim() === '' ? null : notes.trim(),
        items: built.lines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      });

      rememberOrderPhone(result.order_code, normalizedPhone);
      setRedirecting(true);
      cart.clear();
      router.push(
        result.payment_method === 'cod'
          ? `/orders/${result.order_code}`
          : `/orders/${result.order_code}/pay`
      );
    } catch (submitError) {
      setError(
        getOrderErrorMessage(submitError instanceof Error ? submitError.message : 'unknown')
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <ol aria-label="Langkah checkout" className="mb-8 grid grid-cols-3 gap-2">
        {STEPS.map((step, index) => {
          const done = stepDone[index];
          const current = index === currentStep;
          return (
            <li key={step.id}>
              <a
                href={`#${step.id}`}
                aria-current={current ? 'step' : undefined}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-semibold ${
                  done
                    ? 'border-primary bg-primary/10 text-link'
                    : current
                      ? 'border-accent text-accent-ink'
                      : 'border-line text-muted'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
                  {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                </span>
                {step.label}
              </a>
            </li>
          );
        })}
      </ol>

      <form id="checkout-form" onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section id="langkah-data" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-bold">Data pembeli</h2>
            <Field id={FIELD_IDS.name} label="Nama lengkap" error={visibleError('name')}>
              <input
                id={FIELD_IDS.name}
                type="text"
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => touch('name')}
                aria-invalid={Boolean(visibleError('name'))}
                aria-describedby={visibleError('name') ? `${FIELD_IDS.name}-error` : undefined}
                className={inputClass(Boolean(visibleError('name')))}
              />
            </Field>
            <Field
              id={FIELD_IDS.phone}
              label="Nomor HP"
              error={visibleError('phone')}
              hint="Dipakai untuk melacak pesanan tanpa login."
            >
              <input
                id={FIELD_IDS.phone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                onBlur={() => touch('phone')}
                aria-invalid={Boolean(visibleError('phone'))}
                aria-describedby={
                  visibleError('phone') ? `${FIELD_IDS.phone}-error` : `${FIELD_IDS.phone}-hint`
                }
                className={inputClass(Boolean(visibleError('phone')))}
              />
            </Field>
          </section>

          <section id="langkah-pengiriman" className="scroll-mt-24 space-y-3">
            <h2 className="text-lg font-bold">Pengiriman</h2>
            <label className={choiceClass(area === 'school')}>
              <input
                type="radio"
                name="deliveryArea"
                value="school"
                checked={area === 'school'}
                onChange={() => setArea('school')}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold">Area sekolah</span>
                <span className="block text-sm text-muted">
                  {siteConfig.delivery.school.method}, {siteConfig.delivery.school.schedule.toLowerCase()} · Gratis
                </span>
              </span>
            </label>
            <label className={choiceClass(area === 'outside', !outsideAvailable)}>
              <input
                type="radio"
                name="deliveryArea"
                value="outside"
                checked={area === 'outside'}
                disabled={!outsideAvailable}
                onChange={() => setArea('outside')}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold">Luar sekolah</span>
                <span className="block text-sm text-muted">
                  {outsideAvailable
                    ? `${siteConfig.delivery.outside.weekdaySchedule}; ${siteConfig.delivery.outside.weekendSchedule.toLowerCase()}`
                    : 'Belum tersedia, admin belum mengatur zona pengiriman'}
                </span>
              </span>
            </label>

            {area === 'outside' ? (
              <Field id={FIELD_IDS.zone} label="Zona pengiriman" error={visibleError('zone')}>
                <select
                  id={FIELD_IDS.zone}
                  value={zoneId}
                  onChange={(event) => setZoneId(event.target.value)}
                  onBlur={() => touch('zone')}
                  aria-invalid={Boolean(visibleError('zone'))}
                  className={inputClass(Boolean(visibleError('zone')))}
                >
                  <option value="">Pilih zona…</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} — {formatRupiah(zone.fee)}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <Field
              id={FIELD_IDS.address}
              label={area === 'school' ? 'Lokasi pengantaran di sekolah (kelas/ruangan)' : 'Alamat lengkap'}
              error={visibleError('address')}
            >
              <textarea
                id={FIELD_IDS.address}
                rows={3}
                maxLength={300}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                onBlur={() => touch('address')}
                aria-invalid={Boolean(visibleError('address'))}
                aria-describedby={visibleError('address') ? `${FIELD_IDS.address}-error` : undefined}
                className={inputClass(Boolean(visibleError('address')))}
              />
            </Field>
            <Field id="field-notes" label="Catatan (opsional)">
              <textarea
                id="field-notes"
                rows={2}
                maxLength={300}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={inputClass(false)}
              />
            </Field>
          </section>

          <section id="langkah-pembayaran" className="scroll-mt-24 space-y-3">
            <fieldset id={FIELD_IDS.method} tabIndex={-1} className="space-y-3 focus:outline-none">
              <legend className="text-lg font-bold">Metode pembayaran</legend>
              {paymentOptions.map((option) => (
                <label key={option.method} className={choiceClass(method === option.method)}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.method}
                    checked={method === option.method}
                    onChange={() => {
                      setMethod(option.method);
                      touch('method');
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-sm text-muted">{option.hint}</span>
                  </span>
                </label>
              ))}
              {visibleError('method') ? (
                <p className="text-sm text-danger-ink" role="alert">
                  {visibleError('method')}
                </p>
              ) : null}
            </fieldset>
            <p className="text-sm leading-relaxed text-muted">
              Pembayaran non-tunai dikonfirmasi maksimal {siteConfig.service.confirmationHours} jam
              pada jam balas
              {siteConfig.contact.replyHours !== ''
                ? ` (${siteConfig.contact.replyHours.toLowerCase()})`
                : ''}
              .
            </p>
          </section>
        </div>

        <aside className="hidden h-fit space-y-4 rounded-2xl bg-soft p-5 lg:sticky lg:top-24 lg:block">
          <h2 className="text-lg font-bold">Ringkasan</h2>
          <OrderSummary
            lines={summaryLines}
            subtotal={built.subtotal}
            shipping={shippingEstimate}
            total={totalEstimate}
          />
          <p className="text-xs text-muted">
            Total final dihitung ulang oleh sistem saat pesanan dibuat.
          </p>
          {longestLeadTime > 0 ? (
            <p className="text-xs text-muted">
              Estimasi pengerjaan terlama: sekitar {longestLeadTime} hari setelah pembayaran terverifikasi.
            </p>
          ) : null}
          <p className="text-xs text-muted">
            Dengan membuat pesanan, kamu menyetujui{' '}
            <Link href="/privasi" className="font-semibold text-link underline">
              kebijakan privasi
            </Link>{' '}
            kami.
          </p>
          {error ? (
            <p className="flex items-start gap-2 text-sm text-danger-ink" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Buat pesanan
          </button>
        </aside>

        <div className="space-y-4 lg:hidden">
          <details className="rounded-2xl bg-soft p-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-bold">
              Ringkasan pesanan
              <span className="text-sm font-semibold text-muted">{summaryLines.length} produk</span>
            </summary>
            <div className="mt-3">
              <OrderSummary
                lines={summaryLines}
                subtotal={built.subtotal}
                shipping={shippingEstimate}
                total={totalEstimate}
              />
            </div>
          </details>
          {longestLeadTime > 0 ? (
            <p className="text-xs text-muted">
              Estimasi pengerjaan terlama: sekitar {longestLeadTime} hari setelah pembayaran terverifikasi.
            </p>
          ) : null}
          <p className="text-xs text-muted">
            Dengan membuat pesanan, kamu menyetujui{' '}
            <Link href="/privasi" className="font-semibold text-link underline">
              kebijakan privasi
            </Link>{' '}
            kami.
          </p>
          {error ? (
            <p className="flex items-start gap-2 text-sm text-danger-ink" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
            </p>
          ) : null}
        </div>
      </form>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-4 pt-3 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Total (estimasi)</p>
            <p className="text-lg font-extrabold">{formatRupiah(totalEstimate)}</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Buat pesanan
          </button>
        </div>
      </div>
    </>
  );
}