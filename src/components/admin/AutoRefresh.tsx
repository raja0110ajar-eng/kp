'use client';

import { useCallback, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { secondaryButtonClass } from '@/components/admin/styles';

/** Memuat ulang data halaman otomatis (hanya saat tab terlihat) dan lewat tombol manual. */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, refresh]);

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-muted sm:inline">
        Diperbarui otomatis tiap {Math.round(intervalMs / 1000)} detik
      </span>
      <button type="button" onClick={refresh} disabled={pending} className={secondaryButtonClass}>
        <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} aria-hidden />
        Muat ulang
      </button>
    </div>
  );
}