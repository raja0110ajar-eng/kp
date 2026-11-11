'use client';

import { useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { getOrderErrorMessage } from '@/lib/orders/errors';
import { listReviewableItems, submitReview, type ReviewableItem } from '@/lib/reviews/api';

type Status = ReviewableItem['review_status'];

const STATUS_TEXT: Record<Exclude<Status, null>, string> = {
  pending: 'Ulasanmu sedang ditinjau admin. Terima kasih!',
  approved: 'Ulasanmu sudah tayang di halaman produk. Terima kasih!',
  rejected: 'Ulasanmu tidak ditayangkan.',
};

function ReviewForm({
  item,
  orderCode,
  phone,
  onDone,
}: {
  item: ReviewableItem;
  orderCode: string;
  phone: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating < 1) {
      setError('Pilih rating bintang dulu.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitReview({ orderCode, phone, orderItemId: item.order_item_id, rating, body });
      onDone();
    } catch (caught) {
      setError(getOrderErrorMessage(caught instanceof Error ? caught.message : 'unknown'));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={`Rating untuk ${item.product_name}`} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} bintang`}
            onClick={() => setRating(value)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-accent-ink hover:bg-soft"
          >
            <Star className={`h-6 w-6 ${value <= rating ? 'fill-current' : ''}`} aria-hidden />
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium">
        Ceritakan pengalamanmu (opsional)
        <textarea
          rows={3}
          maxLength={600}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-3 text-base text-ink focus:border-primary"
        />
      </label>

      {error ? (
        <p className="text-sm text-danger-ink" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Kirim ulasan
      </button>
    </div>
  );
}

export function ReviewSection({ orderCode, phone }: { orderCode: string; phone: string }) {
  const [items, setItems] = useState<ReviewableItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await listReviewableItems(orderCode, phone);
        if (!cancelled) setItems(result ?? []);
      } catch {
        if (!cancelled) setItems([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderCode, phone]);

  if (!items || items.length === 0) return null;

  function markPending(itemId: string) {
    setItems((current) =>
      (current ?? []).map((entry) =>
        entry.order_item_id === itemId ? { ...entry, review_status: 'pending' } : entry
      )
    );
  }

  return (
    <section className="space-y-5 rounded-2xl border border-line bg-surface p-5" aria-label="Tulis ulasan">
      <div>
        <h2 className="text-lg font-bold">Bagaimana pesananmu?</h2>
        <p className="text-sm text-muted">
          Ulasan tampil di halaman produk setelah disetujui admin, dengan nama depanmu saja.
        </p>
      </div>

      <ul className="space-y-6">
        {items.map((item) => (
          <li key={item.order_item_id} className="space-y-3 border-t border-line pt-5 first:border-t-0 first:pt-0">
            <p className="font-semibold">{item.product_name}</p>
            {item.review_status ? (
              <p className="text-sm text-muted">{STATUS_TEXT[item.review_status]}</p>
            ) : (
              <ReviewForm
                item={item}
                orderCode={orderCode}
                phone={phone}
                onDone={() => markPending(item.order_item_id)}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}