'use client';

import { useState, useTransition } from 'react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  cardClass,
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/admin/styles';
import { setReviewStatusAction, toggleReviewFeaturedAction } from '@/lib/admin/actions/reviews';
import type { AdminReview } from '@/lib/admin/types';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatDateTime } from '@/lib/format';

export function ReviewModerationCard({ review }: { review: AdminReview }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <article className={`${cardClass} space-y-3`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <RatingStars value={review.rating} />
          <span className="font-semibold">{review.displayName}</span>
          <span className="text-sm text-muted">untuk {review.productName}</span>
        </div>
        <div className="flex items-center gap-2">
          {review.isFeatured ? <StatusBadge tone="blue">Disorot di beranda</StatusBadge> : null}
          <span className="text-xs text-muted">{formatDateTime(review.createdAt)}</span>
        </div>
      </header>

      {review.body !== '' ? (
        <p className="whitespace-pre-line leading-relaxed text-ink-soft">{review.body}</p>
      ) : (
        <p className="text-sm text-muted">Hanya rating, tanpa tulisan.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {review.status !== 'approved' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setReviewStatusAction(review.id, 'approved'))}
            className={primaryButtonClass}
          >
            Setujui
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => toggleReviewFeaturedAction(review.id, !review.isFeatured))}
            className={secondaryButtonClass}
          >
            {review.isFeatured ? 'Lepas dari beranda' : 'Sorot di beranda'}
          </button>
        )}
        {review.status !== 'rejected' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setReviewStatusAction(review.id, 'rejected'))}
            className={review.status === 'approved' ? secondaryButtonClass : dangerButtonClass}
          >
            {review.status === 'approved' ? 'Tarik dari tayang' : 'Tolak'}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-danger-ink" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}