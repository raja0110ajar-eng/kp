'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
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

interface PaymentOption {
  method: PaymentMethod;
  label: string;
  hint: string;
}

interface CheckoutFormProps {
  zones: ShippingZone[];
  paymentSettings: PaymentSetting[];
}

const inputClass =
  'mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#0066FF]';

function choiceClass(selected: boolean, disabled = false): string {
  const base = 'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition';
  if (disabled) return `${base} cursor-not-allowed border-neutral-200 opacity-50`;
  return selected
    ? `${base} border-[#0066FF] bg-[#0066FF]/5`
    : `${base} border-neutral-200 hover:border-neutral-400`;
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
      <p className="flex items-center gap-2 text-neutral-600" aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Pesanan dibuat, mengalihkan ke
        pembayaran…
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl bg-neutral-50 p-10 text-center">
        <p className="text-neutral-700">Keranjangmu kosong, belum ada yang bisa di-checkout.</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-lg bg-[#0066FF] px-5 py-2 font-semibold text-white transition hover:bg-[#1A73E8]"
        >
          Lihat katalog
        </Link>
      </div>
    );
  }

  if (productsState.status === 'loading') {
    return (
      <p className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memuat keranjang…
      </p>
    );
  }

  if (productsState.status === 'error' || !built) {
    return (
      <p className="flex items-center gap-2 text-[#FF6B00]" role="alert">
        <AlertTriangle className="h-4 w-4" aria-hidden /> Gagal memuat keranjang. Muat ulang halaman.
      </p>
    );
  }

  if (built.blocked.length > 0 || built.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-[#FF6B00] bg-[#FF6B00]/5 p-6">
        <p className="text-neutral-800">
          Ada produk di keranjang yang habis atau sudah tidak tersedia. Rapikan keranjang dulu sebelum
          checkout.
        </p>
        <Link
          href="/cart"
          className="mt-4 inline-block rounded-lg bg-[#0066FF] px-5 py-2 font-semibold text-white transition hover:bg-[#1A73E8]"
        >
          Kembali ke keranjang
        </Link>
      </div>
    );
  }

  const selectedZone = zones.find((zone) => zone.id === zoneId) ?? null;
  const shippingEstimate = area === 'outside' && selectedZone ? selectedZone.fee : 0;
  const totalEstimate = built.subtotal + shippingEstimate;
  const outsideAvailable = zones.length > 0;

  function validate(): string | null {
    if (name.trim().length === 0) return 'Nama wajib diisi.';
    if (!isValidPhone(phone)) {
      return 'Nomor HP tidak valid. Gunakan nomor seluler Indonesia, contoh 081234567890.';
    }
    if (area === 'outside' && zoneId === '') return 'Pilih zona pengiriman.';
    if (address.trim().length === 0) return 'Alamat atau lokasi pengantaran wajib diisi.';
    if (method === '') return 'Pilih metode pembayaran.';
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !built || method === '') {
      setError(method === '' ? 'Pilih metode pembayaran.' : error);
      return;
    }

    const problem = validate();
    if (problem) {
      setError(problem);
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
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Data pembeli</h2>
          <label className="block text-sm font-medium">
            Nama lengkap
            <input
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
            <span className="mt-1 block text-xs font-normal text-neutral-500">
              Dipakai untuk melacak pesanan tanpa login.
            </span>
          </label>
        </section>

        <section className="space-y-3">
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
              <span className="block text-sm text-neutral-600">
                Diantar ke kelas atau lokasi di sekolah · Gratis
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
              <span className="block text-sm text-neutral-600">
                {outsideAvailable
                  ? 'Diantar kurir tim kami, tarif sesuai zona'
                  : 'Belum tersedia, admin belum mengatur zona pengiriman'}
              </span>
            </span>
          </label>

          {area === 'outside' ? (
            <label className="block text-sm font-medium">
              Zona pengiriman
              <select
                required
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                className={inputClass}
              >
                <option value="">Pilih zona…</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {formatRupiah(zone.fee)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-medium">
            {area === 'school' ? 'Lokasi pengantaran di sekolah (kelas/ruangan)' : 'Alamat lengkap'}
            <textarea
              required
              rows={3}
              maxLength={300}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Catatan (opsional)
            <textarea
              rows={2}
              maxLength={300}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputClass}
            />
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Metode pembayaran</h2>
          {paymentOptions.map((option) => (
            <label key={option.method} className={choiceClass(method === option.method)}>
              <input
                type="radio"
                name="paymentMethod"
                value={option.method}
                checked={method === option.method}
                onChange={() => setMethod(option.method)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold">{option.label}</span>
                <span className="block text-sm text-neutral-600">{option.hint}</span>
              </span>
            </label>
          ))}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl bg-neutral-50 p-5 lg:sticky lg:top-20">
        <h2 className="text-lg font-bold">Ringkasan</h2>
        <ul className="space-y-2 text-sm">
          {built.lines.map((line) => (
            <li key={line.product.id} className="flex justify-between gap-3">
              <span>
                {line.product.name} × {line.quantity}
              </span>
              <span className="font-medium">{formatRupiah(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatRupiah(built.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Ongkir</dt>
            <dd>{shippingEstimate === 0 ? 'Gratis' : formatRupiah(shippingEstimate)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-base font-extrabold">
            <dt>Total (estimasi)</dt>
            <dd>{formatRupiah(totalEstimate)}</dd>
          </div>
        </dl>
        <p className="text-xs text-neutral-500">
          Total final dihitung ulang oleh sistem saat pesanan dibuat.
        </p>

        {error ? (
          <p className="flex items-start gap-2 text-sm text-[#FF6B00]" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-4 py-3 font-semibold text-white transition hover:bg-[#1A73E8] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Buat pesanan
        </button>
      </aside>
    </form>
  );
}