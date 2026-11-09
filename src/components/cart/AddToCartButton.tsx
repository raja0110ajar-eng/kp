'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import { MAX_LINE_QUANTITY } from '@/lib/cart/cart-lines';
import { useCart } from '@/lib/cart/cart-store';

interface AddToCartButtonProps {
  productId: string;
  stock: number;
}

export function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const { items, addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const max = Math.min(MAX_LINE_QUANTITY, stock);
  const inCart = items.find((item) => item.productId === productId)?.quantity ?? 0;
  const soldOut = stock <= 0;
  const atLimit = !soldOut && inCart >= max;

  function handleAdd() {
    addItem(productId, quantity, stock);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  }

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-sunken px-4 py-3 font-semibold text-muted"
      >
        Stok habis
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Jumlah</span>
        <div className="inline-flex items-center rounded-lg border border-line-strong">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            className="p-2 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-10 text-center font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Tambah jumlah"
            onClick={() => setQuantity((current) => Math.min(max, current + 1))}
            disabled={quantity >= max}
            className="p-2 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={atLimit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
      >
        {added ? (
          <Check className="h-5 w-5" aria-hidden />
        ) : (
          <ShoppingCart className="h-5 w-5" aria-hidden />
        )}
        {atLimit ? 'Jumlah maksimum sudah di keranjang' : added ? 'Ditambahkan' : 'Tambah ke keranjang'}
      </button>

      {inCart > 0 ? (
        <p className="text-sm text-muted">
          {inCart} item ini sudah ada di keranjang.{' '}
          <Link href="/cart" className="font-semibold text-link underline">
            Lihat keranjang
          </Link>
        </p>
      ) : null}
    </div>
  );
}