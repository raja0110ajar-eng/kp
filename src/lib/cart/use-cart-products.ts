'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PRODUCT_COLUMNS } from '@/lib/catalog/columns';
import type { CartItem } from '@/lib/cart/cart-store';
import type { ProductSummary } from '@/types/catalog';

export type CartProductsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; products: ProductSummary[] };

type Outcome = { status: 'error' } | { status: 'ready'; products: ProductSummary[] };

const LOADING: CartProductsState = { status: 'loading' };
const EMPTY_READY: CartProductsState = { status: 'ready', products: [] };

/** Mengambil data produk terkini (harga, stok) untuk isi keranjang. Harga di localStorage tidak pernah dipercaya. */
export function useCartProducts(items: CartItem[]): CartProductsState {
  const idsKey = items
    .map((item) => item.productId)
    .sort()
    .join(',');
  const [loaded, setLoaded] = useState<{ key: string; outcome: Outcome } | null>(null);

  useEffect(() => {
    if (idsKey === '') return;
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .in('id', idsKey.split(','));
      if (cancelled) return;

      setLoaded({
        key: idsKey,
        outcome: error
          ? { status: 'error' }
          : { status: 'ready', products: (data ?? []) as unknown as ProductSummary[] },
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (idsKey === '') return EMPTY_READY;
  if (!loaded || loaded.key !== idsKey) return LOADING;
  return loaded.outcome;
}