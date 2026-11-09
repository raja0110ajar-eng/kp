'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Loader2, MessageCircle, X } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  cardClass,
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/admin/styles';
import { rejectPaymentAction, verifyPaymentAction } from '@/lib/admin/actions/payments';
import { AI_STATUS_META, PAYMENT_METHOD_LABEL, describeAiResult } from '@/lib/admin/labels';
import type { AdminPaymentReview } from '@/lib/admin/types';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { toWhatsAppUrl } from '@/lib/phone';

const QUICK_REASONS = [
  'Nominal tidak sesuai',
  'Bukti buram atau tidak terbaca',
  'Bukti tidak valid',
  'Transfer ke tujuan yang salah',
] as const;

type Mode = 'idle' | 'confirm-verify' | 'reject';

export function PaymentReviewCard({ review }: { review: AdminPaymentReview }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isCod = review.method === 'cod';
  const aiMeta = AI_STATUS_META[review.aiStatus];
  const whatsappUrl = toWhatsAppUrl(review.customerPhone);

  function runVerify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyPaymentAction(review.paymentId);
      if (result.ok) {
        setMessage(result.message);
        setMode('idle');
      } else {
        setError(result.error);
      }
    });
  }

  function runReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectPaymentAction(review.paymentId, note);
      if (result.ok) {
        setMessage(result.message);
        setMode('idle');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <article className={`${cardClass} space-y-4`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/admin/orders/${review.orderId}`}
            className="text-lg font-extrabold text-[#0066FF] hover:underline"
          >
            {review.orderCode}
          </Link>
          <p className="text-sm text-neutral-700">
            {review.customerName} · {review.customerPhone}
          </p>
          <p className="text-xs text-neutral-500">
            {PAYMENT_METHOD_LABEL[review.method]} · menunggu sejak {formatDateTime(review.waitingSince)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">Total yang diharapkan</p>
          <p className="text-2xl font-extrabold">{formatRupiah(review.expectedAmount)}</p>
        </div>
      </header>

      <section className="space-y-2 rounded-xl bg-neutral-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={aiMeta.tone}>{aiMeta.label}</StatusBadge>
          {review.confidence !== null && !isCod ? (
            <span className="text-xs text-neutral-500">confidence OCR {review.confidence}</span>
          ) : null}
        </div>
        <p className="text-sm text-neutral-700">
          {describeAiResult({
            aiStatus: review.aiStatus,
            expectedAmount: review.expectedAmount,
            detectedAmounts: review.detectedAmounts,
            confidence: review.confidence,
            rawText: review.rawText,
          })}
        </p>

        {!isCod ? (
          <div>
            <p className="text-xs font-semibold text-neutral-500">Nominal yang terbaca</p>
            {review.detectedAmounts.length === 0 ? (
              <p className="text-sm text-neutral-500">Tidak ada.</p>
            ) : (
              <ul className="mt-1 flex flex-wrap gap-2">
                {review.detectedAmounts.map((amount) => (
                  <li
                    key={amount}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      amount === review.expectedAmount
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-neutral-700 ring-1 ring-neutral-200'
                    }`}
                  >
                    {formatRupiah(amount)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {review.rawText ? (
          <details className="text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-[#0066FF]">
              Teks mentah hasil OCR
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-neutral-700">
              {review.rawText}
            </pre>
          </details>
        ) : null}
      </section>

      {!isCod ? (
        review.proofUrl ? (
          <a href={review.proofUrl} target="_blank" rel="noopener noreferrer" className="block w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={review.proofUrl}
              alt={`Bukti transfer pesanan ${review.orderCode}`}
              loading="lazy"
              className="max-h-96 w-auto rounded-lg border border-neutral-200"
            />
          </a>
        ) : (
          <p className="flex items-center gap-2 text-sm text-[#FF6B00]">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Foto bukti tidak bisa dimuat. Muat ulang halaman, atau periksa file di Storage.
          </p>
        )
      ) : null}

      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? (
        <p className="flex items-start gap-2 text-sm text-[#FF6B00]" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : null}

      {mode === 'idle' ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMode('confirm-verify')} className={primaryButtonClass}>
            <Check className="h-4 w-4" aria-hidden />
            {isCod ? 'Konfirmasi pesanan' : 'Verifikasi pembayaran'}
          </button>
          <button type="button" onClick={() => setMode('reject')} className={secondaryButtonClass}>
            <X className="h-4 w-4" aria-hidden />
            {isCod ? 'Tolak (batalkan pesanan)' : 'Tolak'}
          </button>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryButtonClass}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}

      {mode === 'confirm-verify' ? (
        <div className="space-y-3 rounded-xl border border-[#0066FF] bg-[#0066FF]/5 p-4">
          <p className="text-sm">
            {isCod
              ? 'Pesanan akan dikonfirmasi: stok produk berkurang dan status menjadi Diproses.'
              : 'Pembayaran akan ditandai terverifikasi: stok produk berkurang dan status pesanan menjadi Diproses. Sudah mengecek foto buktinya?'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={runVerify} disabled={pending} className={primaryButtonClass}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Ya, lanjutkan
            </button>
            <button
              type="button"
              onClick={() => setMode('idle')}
              disabled={pending}
              className={secondaryButtonClass}
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'reject' ? (
        <div className="space-y-3 rounded-xl border border-[#FF6B00] bg-[#FF6B00]/5 p-4">
          <label className="block text-sm font-medium">
            Alasan penolakan (wajib, dilihat pembeli)
            <textarea
              rows={2}
              maxLength={300}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setNote(reason)}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold transition hover:bg-neutral-100"
              >
                {reason}
              </button>
            ))}
          </div>
          {isCod ? (
            <p className="text-xs text-neutral-600">Pesanan COD yang ditolak akan dibatalkan.</p>
          ) : (
            <p className="text-xs text-neutral-600">Pembeli bisa mengunggah bukti baru setelah ditolak.</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={runReject}
              disabled={pending || note.trim() === ''}
              className={dangerButtonClass}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Tolak pembayaran
            </button>
            <button
              type="button"
              onClick={() => setMode('idle')}
              disabled={pending}
              className={secondaryButtonClass}
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}