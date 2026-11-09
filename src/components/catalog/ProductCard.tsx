'use client';

import Link from 'next/link';
import { MotionConfig, motion } from 'motion/react';
import { ProductImage } from '@/components/catalog/ProductImage';
import { PRODUCT_TYPE_BADGE_CLASS, PRODUCT_TYPE_LABEL } from '@/lib/catalog/labels';
import { formatRupiah } from '@/lib/format';
import type { ProductSummary } from '@/types/catalog';

interface ProductCardProps {
  product: ProductSummary;
  /** Urutan di grid, dipakai untuk jeda animasi muncul berurutan. */
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const soldOut = product.stock <= 0;

  return (
    <MotionConfig reducedMotion="user">
      <motion.li
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, delay: Math.min(index, 7) * 0.06, ease: 'easeOut' }}
        className="list-none"
      >
        <Link
          href={`/products/${product.slug}`}
          className="group block overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong"
        >
          <div className="relative">
            <ProductImage
              path={product.image_path}
              alt={product.name}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              zoom
            />
            {soldOut ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold text-white">
                Habis
              </span>
            ) : null}
          </div>
          <div className="space-y-1.5 p-4">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PRODUCT_TYPE_BADGE_CLASS[product.product_type]}`}
            >
              {PRODUCT_TYPE_LABEL[product.product_type]}
            </span>
            <h3 className="font-semibold leading-snug">{product.name}</h3>
            <p className="text-lg font-bold text-link">{formatRupiah(product.price)}</p>
          </div>
        </Link>
      </motion.li>
    </MotionConfig>
  );
}