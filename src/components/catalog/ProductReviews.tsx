import { RatingStars } from '@/components/ui/RatingStars';
import type { RatingSummary, ReviewItem } from '@/lib/reviews/summary';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'Asia/Jakarta',
});

export function ProductReviews({
  items,
  summary,
}: {
  items: ReviewItem[];
  summary: RatingSummary | null;
}) {
  return (
    <section aria-labelledby="ulasan" className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="ulasan" className="text-2xl font-extrabold tracking-tight">
          Ulasan pembeli
        </h2>
        {summary ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <RatingStars value={summary.average} />
            <span>
              {summary.average.toFixed(1).replace('.', ',')} dari {summary.count} ulasan
            </span>
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-muted">
          Belum ada ulasan. Ulasan hanya ditulis oleh pembeli yang pesanannya sudah selesai.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {items.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <RatingStars value={review.rating} />
                <span className="font-semibold">{review.displayName}</span>
                <span className="text-xs text-muted">Pembeli terverifikasi</span>
                <span className="text-xs text-muted">
                  {dateFormatter.format(new Date(review.createdAt))}
                </span>
              </div>
              {review.body !== '' ? (
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{review.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}