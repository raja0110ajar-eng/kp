'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { ProductImage } from '@/components/catalog/ProductImage';
import { buildCartLines } from '@/lib/cart/cart-lines';
import { useCart } from '@/lib/cart/cart-store';
import { useCartProducts } from '@/lib/cart/use-cart-products';
import { formatRupiah } from '@/lib/format';

export function CartView() {
  const { items, setQuantity, removeItem } = useCart();
  const productsState = useCartProducts(items);

  const cart = useMemo(
    () => (productsState.status === 'ready' ? buildCartLines(items, productsState.products) : null),
    [items, productsState]
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-neutral-50 p-10 text-center">
        <p className="text-neutral-700">Keranjangmu masih kosong.</p>
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

  if (productsState.status === 'error' || !cart) {
    return (
      <p className="flex items-center gap-2 text-[#FF6B00]" role="alert">
        <AlertTriangle className="h-4 w-4" aria-hidden /> Gagal memuat keranjang. Muat ulang halaman.
      </p>
    );
  }

  const canCheckout = cart.lines.length > 0 && cart.blocked.length === 0;

  return (
    <div className="space-y-6">
      <ul className="space-y-4">
        {cart.lines.map((line) => (
          <li
            key={line.product.id}
            className="flex gap-4 rounded-2xl border border-neutral-200 p-4"
          >
            <div className="w-20 shrink-0 overflow-hidden rounded-lg">
              <ProductImage path={line.product.image_path} alt={line.product.name} sizes="80px" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/products/${line.product.slug}`}
                    className="font-semibold hover:text-[#0066FF]"
                  >
                    {line.product.name}
                  </Link>
                  <p className="text-sm text-neutral-600">{formatRupiah(line.product.price)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Hapus ${line.product.name} dari keranjang`}
                  onClick={() => removeItem(line.product.id)}
                  className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-[#FF6B00]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="inline-flex items-center rounded-lg border border-neutral-300">
                  <button
                    type="button"
                    aria-label="Kurangi jumlah"
                    onClick={() =>
                      setQuantity(line.product.id, line.quantity - 1, line.product.stock)
                    }
                    disabled={line.quantity <= 1}
                    className="p-2 disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="min-w-10 text-center font-semibold">{line.quantity}</span>
                  <button
                    type="button"
                    aria-label="Tambah jumlah"
                    onClick={() =>
                      setQuantity(line.product.id, line.quantity + 1, line.product.stock)
                    }
                    disabled={line.quantity >= Math.min(99, line.product.stock)}
                    className="p-2 disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <p className="font-bold">{formatRupiah(line.lineTotal)}</p>
              </div>

              {line.adjusted ? (
                <p className="text-xs text-[#FF6B00]">
                  Jumlah disesuaikan dengan stok yang tersedia ({line.product.stock}).
                </p>
              ) : null}
            </div>
          </li>
        ))}

        {cart.blocked.map((blocked) => (
          <li
            key={blocked.productId}
            className="flex items-center justify-between gap-4 rounded-2xl border border-[#FF6B00] bg-[#FF6B00]/5 p-4"
          >
            <p className="text-sm">
              <strong>{blocked.product ? blocked.product.name : 'Produk'}</strong>{' '}
              {blocked.reason === 'out_of_stock'
                ? 'sedang habis.'
                : 'sudah tidak tersedia lagi.'}{' '}
              Hapus dari keranjang untuk melanjutkan.
            </p>
            <button
              type="button"
              aria-label="Hapus dari keranjang"
              onClick={() => removeItem(blocked.productId)}
              className="rounded-lg p-2 text-[#FF6B00] transition hover:bg-[#FF6B00]/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-2xl bg-neutral-50 p-5">
        <div className="flex items-center justify-between">
          <span className="text-neutral-700">Subtotal</span>
          <span className="text-xl font-extrabold">{formatRupiah(cart.subtotal)}</span>
        </div>
        <p className="text-xs text-neutral-500">Ongkir dihitung di halaman checkout.</p>
        {canCheckout ? (
          <Link
            href="/checkout"
            className="block rounded-lg bg-[#0066FF] px-4 py-3 text-center font-semibold text-white transition hover:bg-[#1A73E8]"
          >
            Lanjut ke checkout
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="block rounded-lg bg-neutral-200 px-4 py-3 text-center font-semibold text-neutral-500"
          >
            Lanjut ke checkout
          </span>
        )}
      </div>
    </div>
  );
}