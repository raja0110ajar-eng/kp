import Link from 'next/link';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
import { ReviewModerationCard } from '@/components/admin/ReviewModerationCard';
import { getAdminReviews } from '@/lib/admin/extra-queries';
import { firstParam, type RawSearchParams } from '@/lib/search-params';

const TABS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Tayang' },
  { value: 'rejected', label: 'Ditolak' },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const raw = firstParam(params.status);
  const status = TABS.find((tab) => tab.value === raw)?.value ?? 'pending';

  const reviews = await getAdminReviews(status);

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Ulasan</h1>
          <p className="text-sm text-muted">
            Hanya pembeli dengan pesanan selesai yang bisa menulis. Ulasan tayang setelah kamu setujui.
          </p>
        </div>
        <AutoRefresh />
      </header>

      <nav aria-label="Filter status" className="flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === 'pending' ? '/admin/reviews' : `/admin/reviews?status=${tab.value}`}
            aria-current={tab.value === status ? 'page' : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              tab.value === status
                ? 'border-primary bg-primary text-white'
                : 'border-line-strong bg-surface hover:bg-soft'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <p className="rounded-2xl bg-surface p-10 text-center text-muted">Tidak ada ulasan di sini.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </main>
  );
}