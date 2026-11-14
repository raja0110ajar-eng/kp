'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { toggleProductFeaturedAction } from '@/lib/admin/actions/featured';

export function FeaturedToggle({ productId, featured }: { productId: string; featured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductFeaturedAction(productId, !featured);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={featured}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 ${
          featured
            ? 'border-accent bg-accent/10 text-accent-ink'
            : 'border-line-strong text-muted hover:bg-soft'
        }`}
      >
        <Star className={`h-4 w-4 ${featured ? 'fill-current' : ''}`} aria-hidden />
        {featured ? 'Unggulan' : 'Jadikan unggulan'}
      </button>
      {error ? <p className="mt-1 text-xs text-danger-ink">{error}</p> : null}
    </div>
  );
}