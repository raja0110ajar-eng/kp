import {
  assertValidExpectedAmount,
  buildFailedResult,
  evaluateTransfer,
} from './evaluate-transfer';
import { prepareProofImage } from './prepare-image';
import type { VerifyTransferOutput } from './types';

const OCR_TIMEOUT_MS = 60_000;

async function runOcr(
  image: Blob,
  onProgress?: (percent: number) => void
): Promise<{ rawText: string; confidence: number }> {
  // Dimuat dinamis agar Tesseract.js tidak ikut bundle awal.
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(Math.round(message.progress * 100));
      }
    },
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('OCR_TIMEOUT')), OCR_TIMEOUT_MS);
    });
    const { data } = await Promise.race([worker.recognize(image), timeout]);
    return { rawText: data.text, confidence: data.confidence };
  } finally {
    if (timer) clearTimeout(timer);
    await worker.terminate().catch(() => undefined);
  }
}

/**
 * Hanya untuk browser. Kegagalan GAMBAR (bukan gambar, terlalu besar) dilempar sebagai ProofImageError.
 * Kegagalan OCR tidak melempar error: hasilnya "unreadable" agar bukti tetap masuk antrean review admin.
 */
export async function verifyTransferProof(
  file: File,
  expectedAmount: number,
  onProgress?: (percent: number) => void
): Promise<VerifyTransferOutput> {
  assertValidExpectedAmount(expectedAmount);

  const imageBlob = await prepareProofImage(file);

  try {
    const { rawText, confidence } = await runOcr(imageBlob, onProgress);
    return { imageBlob, result: evaluateTransfer({ rawText, confidence, expectedAmount }) };
  } catch {
    return { imageBlob, result: buildFailedResult(expectedAmount) };
  }
}