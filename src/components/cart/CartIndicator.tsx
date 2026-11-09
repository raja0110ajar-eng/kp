 'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '@/lib/cart/cart-store';

export function CartIndicator() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Keranjang, ${totalQuantity} item`}
      className="relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-soft"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">Keranjang</span>
      {totalQuantity > 0 ? (
        <motion.span
          key={totalQuantity}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white"
        >
          {totalQuantity}
        </motion.span>
      ) : null}
    </Link>
  );
}