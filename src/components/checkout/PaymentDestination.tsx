'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Copy } from 'lucide-react';
import { getPublicAssetUrl } from '@/lib/assets';
import type { PaymentSetting } from '@/types/catalog';

export function PaymentDestination({ setting }: { setting: PaymentSetting }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function copyNumber() {
    if (!setting.account_number) return;
    try {
      await navigator.clipboard.writeText(setting.account_number);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard diblokir browser: pembeli tetap bisa menyalin nomor secara manual.
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-line p-5">
      <h2 className="text-lg font-bold">Bayar lewat {setting.display_name}</h2>

      {setting.method === 'qris' && setting.qris_image_path ? (
        <div className="mx-auto w-full max-w-xs overflow-hidden rounded-xl border border-line bg-white p-2">
          {/* unoptimized: QRIS tidak boleh dikompres ulang agar tetap terbaca scanner. */}
          <Image
            src={getPublicAssetUrl(setting.qris_image_path)}
            alt="Kode QRIS pembayaran Karsa Pandiga"
            width={640}
            height={640}
            unoptimized
            className="h-auto w-full"
          />
        </div>
      ) : null}

      {setting.account_number ? (
        <div className="space-y-1">
          {setting.account_name ? (
            <p className="text-sm text-muted">a.n. {setting.account_name}</p>
          ) : null}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3">
            <span className="text-lg font-bold tracking-wide">{setting.account_number}</span>
            <button
              type="button"
              onClick={copyNumber}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-link transition hover:bg-primary/10"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>
      ) : null}

      {setting.instructions ? (
        <p className="text-sm text-ink-soft">{setting.instructions}</p>
      ) : null}
    </section>
  );
}