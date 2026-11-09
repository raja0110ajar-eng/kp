import { MIN_OCR_CONFIDENCE } from '@/lib/ocr/evaluate-transfer';
import type {
  AiStatus,
  DeliveryArea,
  OrderStatus,
  PaymentMethod,
  VerificationStatus,
} from '@/types/domain';

export type Tone = 'neutral' | 'blue' | 'orange' | 'green' | 'red';

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const ORDER_STATUS_VALUES: readonly OrderStatus[] = [
  'awaiting_payment',
  'awaiting_verification',
  'processing',
  'delivering',
  'completed',
  'cancelled',
];

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  awaiting_payment: { label: 'Menunggu pembayaran', tone: 'neutral' },
  awaiting_verification: { label: 'Menunggu verifikasi', tone: 'orange' },
  processing: { label: 'Diproses', tone: 'blue' },
  delivering: { label: 'Diantar', tone: 'blue' },
  completed: { label: 'Selesai', tone: 'green' },
  cancelled: { label: 'Dibatalkan', tone: 'red' },
};

export const VERIFICATION_META: Record<VerificationStatus, StatusMeta> = {
  awaiting_proof: { label: 'Belum ada bukti', tone: 'neutral' },
  awaiting_review: { label: 'Perlu review', tone: 'orange' },
  verified: { label: 'Terverifikasi', tone: 'green' },
  rejected: { label: 'Ditolak', tone: 'red' },
};

export const AI_STATUS_META: Record<AiStatus, StatusMeta> = {
  not_applicable: { label: 'Tanpa AI (COD)', tone: 'neutral' },
  pending: { label: 'Belum diperiksa', tone: 'neutral' },
  matched: { label: 'AI: cocok', tone: 'green' },
  mismatch: { label: 'AI: tidak cocok', tone: 'red' },
  unreadable: { label: 'AI: tidak terbaca', tone: 'orange' },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: 'COD',
  qris: 'QRIS',
  dana: 'DANA',
  ovo: 'OVO',
  gopay: 'GoPay',
  bank_transfer: 'Transfer bank',
};

export const DELIVERY_AREA_LABEL: Record<DeliveryArea, string> = {
  school: 'Area sekolah',
  outside: 'Luar sekolah',
};

interface AiDescriptionInput {
  aiStatus: AiStatus;
  expectedAmount: number;
  detectedAmounts: number[];
  confidence: number | null;
  rawText: string | null;
}

/** Penjelasan hasil AI untuk admin. Alasan diturunkan dari data OCR yang tersimpan. */
export function describeAiResult(input: AiDescriptionInput): string {
  switch (input.aiStatus) {
    case 'not_applicable':
      return 'Pesanan COD: tidak ada bukti transfer untuk diperiksa.';
    case 'pending':
      return 'Pembeli belum mengunggah bukti.';
    case 'matched':
      return 'Nominal persis sama dengan total pesanan. Tetap cek fotonya: OCR tidak bisa mendeteksi bukti palsu.';
    case 'mismatch':
      return input.detectedAmounts.includes(input.expectedAmount)
        ? 'Angka yang sama ditemukan, tetapi tanpa penanda Rp atau kata kunci pembayaran di barisnya. Periksa fotonya.'
        : 'Total pesanan tidak ada di antara nominal yang terbaca. Bisa jadi nominal salah atau ada biaya admin.';
    case 'unreadable':
      if (!input.rawText || input.rawText.trim() === '') {
        return 'OCR tidak menghasilkan teks (gagal berjalan atau gambar tidak terbaca).';
      }
      if (input.detectedAmounts.length === 0) {
        return 'Tidak ada nominal yang terbaca dari gambar.';
      }
      return `Kualitas bacaan rendah (confidence ${input.confidence ?? 0} di bawah ambang ${MIN_OCR_CONFIDENCE}), hasilnya tidak bisa diandalkan.`;
  }
}