export type AiVerdict = 'matched' | 'mismatch' | 'unreadable';

export type AiReason =
  | 'exact_match'
  | 'amount_not_found'
  | 'unmarked_amount_only'
  | 'no_amount_detected'
  | 'low_confidence'
  | 'ocr_failed';

export interface AmountCandidate {
  value: number;
  raw: string;
  line: string;
  /** true jika bertanda Rp/IDR atau satu baris dengan kata kunci pembayaran. */
  isStrong: boolean;
}

export interface TransferVerificationResult {
  aiStatus: AiVerdict;
  reason: AiReason;
  expectedAmount: number;
  matchedAmount: number | null;
  detectedAmounts: number[];
  /** 0 sampai 100, rata-rata confidence Tesseract. */
  confidence: number;
  rawText: string;
}

export interface VerifyTransferOutput {
  result: TransferVerificationResult;
  /** Gambar JPEG terkompresi yang siap diunggah ke Storage. */
  imageBlob: Blob;
}