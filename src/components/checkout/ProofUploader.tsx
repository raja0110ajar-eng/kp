'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { verifyTransferProof } from '@/lib/ocr/verify-transfer';
import { submitPaymentProof } from '@/lib/orders/api';
import { getOrderErrorMessage } from '@/lib/orders/errors';
import { formatRupiah } from '@/lib/format';
import type { AiVerdict } from '@/lib/ocr/types';

type Phase = 'idle' | 'reading' | 'uploading' | 'done' | 'error';

interface ProofUploaderProps {
  orderId: string;
  orderCode: string;
  phone: string;
  expectedAmount: number;
  onSubmitted?: () => void;
}

const RESULT_COPY: Record<AiVerdict, { title: string; body: string; ok: boolean }> = {
  matched: {
    title: 'Nominal cocok dengan total pesanan',
    body: 'Bukti sudah diterima. Admin akan melakukan konfirmasi akhir.',
    ok: true,
  },
  mismatch: {
    title: 'Nominal di bukti tidak cocok dengan total pesanan',
    body: 'Bukti sudah diterima dan akan diperiksa manual oleh admin.',
    ok: false,
  },
  unreadable: {
    title: 'Bukti belum terbaca jelas oleh sistem',
    body: 'Bukti sudah diterima dan akan diperiksa manual oleh admin.',
    ok: false,
  },
};

export function ProofUploader({
  orderId,
  orderCode,
  phone,
  expectedAmount,
  onSubmitted,
}: ProofUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [verdict, setVerdict] = useState<AiVerdict | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const busy = phase === 'reading' || phase === 'uploading';

  async function handleSubmit() {
    if (!file) return;
    setErrorMessage(null);
    setProgress(0);
    setPhase('reading');

    try {
      const { result, imageBlob } = await verifyTransferProof(file, expectedAmount, setProgress);

      setPhase('uploading');
      const proofPath = `${orderId}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(proofPath, imageBlob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      await submitPaymentProof({ orderCode, phone, proofPath, verification: result });

      setVerdict(result.aiStatus);
      setPhase('done');
      onSubmitted?.();
    } catch (error) {
      setErrorMessage(getOrderErrorMessage(error instanceof Error ? error.message : 'unknown'));
      setPhase('error');
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 p-5">
      <header>
        <h2 className="text-lg font-bold">Unggah bukti transfer</h2>
        <p className="text-sm text-neutral-600">
          Total yang harus dibayar: <strong>{formatRupiah(expectedAmount)}</strong>
        </p>
      </header>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 px-4 py-8 text-center transition hover:border-[#0066FF]">
        <UploadCloud className="h-8 w-8 text-[#0066FF]" aria-hidden />
        <span className="text-sm font-medium">{file ? file.name : 'Pilih screenshot bukti transfer'}</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy || phase === 'done'}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPhase('idle');
            setErrorMessage(null);
          }}
        />
      </label>

      {phase === 'reading' ? (
        <div aria-live="polite">
          <p className="text-sm text-neutral-600">Membaca bukti transfer… {progress}%</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full bg-[#0066FF] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {phase === 'uploading' ? (
        <p className="flex items-center gap-2 text-sm text-neutral-600" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Mengirim bukti…
        </p>
      ) : null}

      {phase === 'error' && errorMessage ? (
        <p className="flex items-start gap-2 text-sm text-[#FF6B00]" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {errorMessage}
        </p>
      ) : null}

      {phase === 'done' && verdict ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl bg-neutral-50 p-4"
        >
          <p className="flex items-center gap-2 font-semibold">
            {RESULT_COPY[verdict].ok ? (
              <CheckCircle2 className="h-5 w-5 text-[#0066FF]" aria-hidden />
            ) : (
              <AlertTriangle className="h-5 w-5 text-[#FF6B00]" aria-hidden />
            )}
            {RESULT_COPY[verdict].title}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{RESULT_COPY[verdict].body}</p>
          <p className="mt-2 text-xs text-neutral-500">
            Simpan kode pesananmu: <strong>{orderCode}</strong>
          </p>
        </motion.div>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || busy || phase === 'done'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 font-semibold text-white transition hover:bg-[#1A73E8] disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Verifikasi &amp; kirim bukti
      </button>
    </section>
  );
}