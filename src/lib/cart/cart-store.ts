'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { MAX_LINE_QUANTITY } from '@/lib/cart/cart-lines';

const STORAGE_KEY = 'kp:cart:v1';
const EMPTY_RAW = '[]';
const MAX_LINES = 50;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CartItem {
  productId: string;
  quantity: number;
}

const listeners = new Set<() => void>();
let memoryRaw = EMPTY_RAW;

// Snapshot berupa string JSON (primitif) sehingga stabil untuk useSyncExternalStore.
function readRaw(): string {
  try {
    memoryRaw = window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_RAW;
  } catch {
    // localStorage diblokir: pakai salinan di memori selama tab terbuka.
  }
  return memoryRaw;
}

function writeRaw(value: string): void {
  memoryRaw = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage diblokir/penuh: keranjang hanya bertahan selama tab terbuka.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', handleStorage);
  };
}

// Data di localStorage tidak dipercaya: setiap entri divalidasi ulang.
function parseItems(raw: string): CartItem[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];

    const items: CartItem[] = [];
    for (const entry of data) {
      if (typeof entry !== 'object' || entry === null) continue;
      const { productId, quantity } = entry as Record<string, unknown>;
      if (typeof productId !== 'string' || !UUID_REGEX.test(productId)) continue;
      if (
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_LINE_QUANTITY
      ) {
        continue;
      }
      if (items.some((item) => item.productId === productId)) continue;
      items.push({ productId, quantity });
      if (items.length >= MAX_LINES) break;
    }
    return items;
  } catch {
    return [];
  }
}

export function useCart() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY_RAW);
  const items = useMemo(() => parseItems(raw), [raw]);
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const mutate = useCallback((change: (current: CartItem[]) => CartItem[]) => {
    writeRaw(JSON.stringify(change(parseItems(readRaw()))));
  }, []);

  const addItem = useCallback(
    (productId: string, quantity: number, stock: number) => {
      const limit = Math.min(MAX_LINE_QUANTITY, stock);
      if (limit < 1 || quantity < 1) return;

      mutate((current) => {
        const existing = current.find((item) => item.productId === productId);
        if (existing) {
          return current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(limit, item.quantity + quantity) }
              : item
          );
        }
        if (current.length >= MAX_LINES) return current;
        return [...current, { productId, quantity: Math.min(limit, quantity) }];
      });
    },
    [mutate]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number, stock: number) => {
      const limit = Math.max(1, Math.min(MAX_LINE_QUANTITY, stock));
      const requested = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
      const next = Math.min(limit, Math.max(1, requested));
      mutate((current) =>
        current.map((item) => (item.productId === productId ? { ...item, quantity: next } : item))
      );
    },
    [mutate]
  );

  const removeItem = useCallback(
    (productId: string) => {
      mutate((current) => current.filter((item) => item.productId !== productId));
    },
    [mutate]
  );

  const clear = useCallback(() => {
    writeRaw(EMPTY_RAW);
  }, []);

  return { items, totalQuantity, addItem, setQuantity, removeItem, clear };
}