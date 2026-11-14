'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatOrderCode } from '@/lib/orders/order-code';
import { removeSavedOrder, useSavedOrders } from '@/lib/orders/saved-orders';
import { getSiteUrl } from '@/lib/site-url';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export function OrderCodeCard({ orderCode }: { orderCode: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saved = useSavedOrders();
  const isSaved = saved.some((entry) => entry.code === orderCode);
  const display = formatOrderCode(orderCode);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard diblokir browser: kode tetap terbaca di layar untuk di-screenshot.
    }
  }

  const whatsappUrl =
    siteConfig.contact.whatsapp !== ''
      ? buildWhatsAppLink(
          siteConfig.contact.whatsapp,
          `Halo Karsa Pandiga, saya sudah membuat pesanan ${display}. Tautan pesanan: ${getSiteUrl()}/orders/${orderCode}`
        )
      : '';

  return (
    <section aria-label="Kode pesanan" className="rounded-2xl border-2 border-primary bg-primary/5 p-5">
      <p className="text-sm font-semibold text-ink-soft">Kode pesananmu</p>
      <p className="mt-1 text-3xl font-extrabold tracking-wider sm:text-4xl">{display}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Simpan kode ini: salin, atau screenshot halaman ini. Dengan kode dan nomor HP, kamu bisa melacak
        pesanan kapan saja.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-white transition hover:bg-primary-hover"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? 'Tersalin' : 'Salin kode'}
        </button>
        {whatsappUrl !== '' ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 font-semibold transition hover:bg-soft"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Kirim konfirmasi ke WhatsApp admin
          </a>
        ) : null}
      </div>

      {isSaved ? (
        <p className="mt-4 text-xs text-muted">
          Pesanan ini diingat di perangkat ini, jadi muncul otomatis di halaman Pesanan.{' '}
          <button
            type="button"
            onClick={() => removeSavedOrder(orderCode)}
            className="font-semibold text-link underline"
          >
            Jangan ingat di perangkat ini
          </button>
        </p>
      ) : null}
    </section>
  );
}