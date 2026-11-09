import Link from 'next/link';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
import { PaymentReviewCard } from '@/components/admin/PaymentReviewCard';
import { QUEUE_LIMIT, getPaymentQueue } from '@/lib/admin/queries';
import type { PaymentQueueFilter } from '@/lib/admin/types';
import { firstParam, type RawSearchParams } from '@/lib/search-params';

const TABS: ReadonlyArray<{ label: string; value: PaymentQueueFilter }> = [
  { label: 'Semua', value: 'all' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'COD', value: 'cod' },
];

export default async function PaymentQueuePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const rawFilter = firstParam(params.method);
  const filter: PaymentQueueFilter =
    rawFilter === 'transfer' || rawFilter === 'cod' ? rawFilter : 'all';

  const reviews = await getPaymentQueue(filter);

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Antrean verifikasi</h1>
          <p className="text-sm text-muted">
            Yang paling lama menunggu ada di atas. {reviews.length} menunggu.
          </p>
        </div>
        <AutoRefresh />
      </header>

      <nav aria-label="Filter metode" className="flex gap-2">
        {TABS.map((tab) => {
          const active = tab.value === filter;
          return (
            <Link
              key={tab.value}
              href={tab.value === 'all' ? '/admin/payments' : `/admin/payments?method=${tab.value}`}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-line-strong bg-surface hover:border-muted'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {reviews.length === 0 ? (
        <p className="rounded-2xl bg-surface p-10 text-center text-muted">
          Tidak ada pembayaran yang menunggu verifikasi.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <PaymentReviewCard key={review.paymentId} review={review} />
          ))}
          {reviews.length >= QUEUE_LIMIT ? (
            <p className="text-center text-xs text-muted">
              Menampilkan {QUEUE_LIMIT} teratas. Selesaikan dulu untuk melihat sisanya.
            </p>
          ) : null}
        </div>
      )}
    </main>
  );
}