import { extractAmountCandidates, uniqueSortedValues } from './parse-amounts';
import type { TransferVerificationResult } from './types';

/** Ambang heuristik (bukan angka resmi Tesseract). Sesuaikan setelah uji dengan screenshot asli. */
export const MIN_OCR_CONFIDENCE = 50;
export const MAX_RAW_TEXT_LENGTH = 4000;

export interface EvaluateInput {
  rawText: string;
  confidence: number;
  expectedAmount: number;
}

export function assertValidExpectedAmount(expectedAmount: number): void {
  if (!Number.isInteger(expectedAmount) || expectedAmount <= 0) {
    throw new RangeError('expectedAmount harus bilangan bulat Rupiah lebih dari 0.');
  }
}

function normalizeConfidence(confidence: number): number {
  const safe = Number.isFinite(confidence) ? confidence : 0;
  return Math.round(Math.min(100, Math.max(0, safe)) * 100) / 100;
}

/** Fungsi murni (tanpa browser/Tesseract) sehingga mudah diuji. */
export function evaluateTransfer({
  rawText,
  confidence,
  expectedAmount,
}: EvaluateInput): TransferVerificationResult {
  assertValidExpectedAmount(expectedAmount);

  const candidates = extractAmountCandidates(rawText);
  const base = {
    expectedAmount,
    detectedAmounts: uniqueSortedValues(candidates),
    confidence: normalizeConfidence(confidence),
    rawText: rawText.slice(0, MAX_RAW_TEXT_LENGTH),
  };

  const strongMatch = candidates.find(
    (candidate) => candidate.isStrong && candidate.value === expectedAmount
  );
  if (strongMatch) {
    return { ...base, aiStatus: 'matched', reason: 'exact_match', matchedAmount: strongMatch.value };
  }

  if (candidates.length === 0) {
    return { ...base, aiStatus: 'unreadable', reason: 'no_amount_detected', matchedAmount: null };
  }

  if (base.confidence < MIN_OCR_CONFIDENCE) {
    return { ...base, aiStatus: 'unreadable', reason: 'low_confidence', matchedAmount: null };
  }

  if (candidates.some((candidate) => candidate.value === expectedAmount)) {
    return { ...base, aiStatus: 'mismatch', reason: 'unmarked_amount_only', matchedAmount: null };
  }

  return { ...base, aiStatus: 'mismatch', reason: 'amount_not_found', matchedAmount: null };
}

export function buildFailedResult(expectedAmount: number): TransferVerificationResult {
  return {
    aiStatus: 'unreadable',
    reason: 'ocr_failed',
    expectedAmount,
    matchedAmount: null,
    detectedAmounts: [],
    confidence: 0,
    rawText: '',
  };
}