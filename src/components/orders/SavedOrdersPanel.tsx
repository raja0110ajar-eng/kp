'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatRupiah } from '@/lib/format';
import { BUYER_ORDER_STATUS } from '@/lib/orders/labels';
import { formatOrderCode } from '@/lib/orders/order-code';
import { formatEtaDate } from '@/lib/orders/schedule';
import { clearSavedOrders, removeSavedOrder, useSavedOrders } from '@/lib/orders/saved-orders';
import { trackOrderDetail } from '@/lib/orders/track-detail';
import type { TrackedOrderDetail } from '@/types/tracking';

type Loaded =
  | { kind: 'ok'; order: TrackedOrderDetail }
  | { kind: 'missing' }
  | { kind: 'error' };

const MAX_SHOWN = 5;

export function SavedOrdersPanel() {
  const saved = useSavedOrders();
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});

  useEffect(() => {
    const entries = saved.slice(0, MAX_SHOWN);
    if (entries.length === 0) return;
    let cancelled = false;

    async function load() {
      const results = await Promise.all(
        entries.map(async (entry): Promise<[string, Loaded]> => {
          try {
            const order = await trackOrderDetail(entry.code, entry.phone);
            return [entry.code, order ? { kind: 'ok', order } : { kind: 'missing' }];
          } catch {
            return [entry.code, { kind: 'error' }];
          }
        })
      );
      if (!cancelled) setLoaded(Object.fromEntries(results));
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [saved]);

  if (saved.length === 0) return null;

  return (
    <section aria-labelledby="pesanan-perangkat" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="pesanan-perangkat" className="text-lg font-bold">
            Pesanan di perangkat ini
          </h2>
          <p className="text-sm text-muted">Tersimpan hanya di browser ini, tanpa perlu mengetik kode.</p>
        </div>
        <button
          type="button"
          onClick={clearSavedOrders}
          className="text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink"
        >
          Hapus semua dari perangkat ini
        </button>
      </div>

      <ul className="space-y-3">
        {saved.slice(0, MAX_SHOWN).map((entry) => {
          const state = loaded[entry.code];
          const order = state?.kind === 'ok' ? state.order : null;
          const meta = order ? BUYER_ORDER_STATUS[order.status] : null;
          const showEta =
            order !== null &&
            order.eta_date !== null &&
            (order.status === 'processing' || order.status === 'ready' || order.status === 'delivering');

          return (
            <li key={entry.code} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/orders/${entry.code}`} className="font-extrabold text-link hover:underline">
                  {formatOrderCode(entry.code)}
                </Link>
                {meta ? <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge> : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted">
                  {state === undefined
                    ? 'Memuat status…'
                    : state.kind === 'missing'
                      ? 'Pesanan tidak ditemukan lagi.'
                      : state.kind === 'error'
                        ? 'Status belum bisa dimuat.'
                        : showEta && order?.eta_date
                          ? `Perkiraan diantar ${formatEtaDate(order.eta_date)}`
                          : 'Buka untuk melihat detail.'}
                </span>
                {order ? <span className="font-semibold">{formatRupiah(order.total)}</span> : null}
              </div>

              <button
                type="button"
                onClick={() => removeSavedOrder(entry.code)}
                className="mt-3 text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink"
              >
                Hapus dari perangkat ini
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}