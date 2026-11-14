'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { ORDER_CODE_REGEX } from '@/lib/orders/order-code';

const STORAGE_KEY = 'kp:orders:v1';
const EMPTY_RAW = '[]';
const MAX_ENTRIES = 10;

export interface SavedOrder {
  code: string;
  phone: string;
  savedAt: number;
}

const listeners = new Set<() => void>();
let memoryRaw = EMPTY_RAW;

function readRaw(): string {
  try {
    memoryRaw = window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_RAW;
  } catch {
    // Storage diblokir: pakai salinan di memori selama tab terbuka.
  }
  return memoryRaw;
}

function writeRaw(value: string): void {
  memoryRaw = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage penuh atau diblokir: daftar hanya bertahan selama tab terbuka.
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
function parse(raw: string): SavedOrder[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];

    const entries: SavedOrder[] = [];
    for (const item of data) {
      if (typeof item !== 'object' || item === null) continue;
      const { code, phone, savedAt } = item as Record<string, unknown>;
      if (typeof code !== 'string' || !ORDER_CODE_REGEX.test(code)) continue;
      if (typeof phone !== 'string' || !/^08[0-9]{8,11}$/.test(phone)) continue;
      if (typeof savedAt !== 'number') continue;
      if (entries.some((entry) => entry.code === code)) continue;
      entries.push({ code, phone, savedAt });
      if (entries.length >= MAX_ENTRIES) break;
    }
    return entries;
  } catch {
    return [];
  }
}

/** Menyimpan pesanan di perangkat ini agar halaman Pesanan menampilkannya tanpa mengetik kode. */
export function saveOrderOnDevice(code: string, phone: string): void {
  const current = parse(readRaw());
  if (current.some((entry) => entry.code === code && entry.phone === phone)) return;

  const next = [
    { code, phone, savedAt: Date.now() },
    ...current.filter((entry) => entry.code !== code),
  ].slice(0, MAX_ENTRIES);
  writeRaw(JSON.stringify(next));
}

export function removeSavedOrder(code: string): void {
  writeRaw(JSON.stringify(parse(readRaw()).filter((entry) => entry.code !== code)));
}

export function clearSavedOrders(): void {
  writeRaw(EMPTY_RAW);
}

/** Pembacaan sekali jalan (bukan hook) untuk mengisi nomor HP otomatis. */
export function getSavedPhone(code: string): string | null {
  return parse(readRaw()).find((entry) => entry.code === code)?.phone ?? null;
}

export function useSavedOrders(): SavedOrder[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY_RAW);
  return useMemo(() => parse(raw), [raw]);
}