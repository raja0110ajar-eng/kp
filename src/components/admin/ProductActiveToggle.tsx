'use client';

import { useState, useTransition } from 'react';
import { secondaryButtonClass } from '@/components/admin/styles';
import { toggleProductActiveAction } from '@/lib/admin/actions/products';

export function ProductActiveToggle({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductActiveAction(productId, !isActive);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className={secondaryButtonClass}>
        {isActive ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
      {error ? <p className="mt-1 text-xs text-[#FF6B00]">{error}</p> : null}
    </div>
  );
}