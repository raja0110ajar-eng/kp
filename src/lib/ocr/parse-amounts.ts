import type { AmountCandidate } from './types';

/** Batas kewajaran nominal transaksi toko ini. Angka di luar batas diabaikan (nomor rekening, timestamp, dll). */
export const MIN_PLAUSIBLE_AMOUNT = 1_000;
export const MAX_PLAUSIBLE_AMOUNT = 100_000_000;

// Grup 1: penanda mata uang (opsional). Grup 2: angka.
// Cocok untuk: 150.000 | 1.250.000 | 150,000.00 | 150.000,00 | 150000 | Rp. 150.000 | IDR 150,000
const AMOUNT_REGEX =
  /((?:rp|idr)\.?\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}(?:[.,]\d{1,2})?)/gi;

const KEYWORD_REGEX =
  /(total|nominal|jumlah|amount|transfer|bayar|pembayaran|payment|tagihan|berhasil|sukses|success)/i;

function toRupiah(token: string): number | null {
  let body = token;

  // Desimal ",00" atau ".00" dibuang. Desimal selain nol dianggap bukan nominal Rupiah valid.
  const decimal = body.match(/[.,](\d{1,2})$/);
  if (decimal) {
    if (Number(decimal[1]) !== 0) return null;
    body = body.slice(0, body.length - decimal[0].length);
  }

  const digits = body.replace(/[.,]/g, '');
  if (!/^\d+$/.test(digits)) return null;

  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

export function extractAmountCandidates(text: string): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    const hasKeyword = KEYWORD_REGEX.test(line);

    for (const match of line.matchAll(AMOUNT_REGEX)) {
      const value = toRupiah(match[2]);
      if (value === null) continue;
      if (value < MIN_PLAUSIBLE_AMOUNT || value > MAX_PLAUSIBLE_AMOUNT) continue;

      candidates.push({
        value,
        raw: match[0].trim(),
        line,
        isStrong: Boolean(match[1]) || hasKeyword,
      });
    }
  }

  return candidates;
}

export function uniqueSortedValues(candidates: AmountCandidate[]): number[] {
  return Array.from(new Set(candidates.map((candidate) => candidate.value))).sort((a, b) => a - b);
}