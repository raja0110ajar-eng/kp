// Kode baru: "KP-" + 6 karakter tanpa 0, 1, I, O. Kode lama: "KP-" + 10 heksadesimal. Keduanya valid.
export const ORDER_CODE_REGEX = /^KP-(?:[0-9A-F]{10}|[2-9A-HJ-NP-Z]{6})$/;

/** Menerima "kp-7k3-m9a", "7K3M9A", atau "KP7K3M9A" dan mengembalikan bentuk kanonik "KP-7K3M9A". */
export function normalizeOrderCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const bodyOnly = cleaned.length === 6 || cleaned.length === 10;
  const body = bodyOnly ? cleaned : cleaned.startsWith('KP') ? cleaned.slice(2) : cleaned;
  return `KP-${body}`;
}

/** Tampilan mudah dibaca: KP-7K3M9A menjadi KP-7K3-M9A. Kode lama dibiarkan. */
export function formatOrderCode(code: string): string {
  const match = /^KP-([2-9A-HJ-NP-Z]{3})([2-9A-HJ-NP-Z]{3})$/.exec(code.toUpperCase());
  return match ? `KP-${match[1]}-${match[2]}` : code;
}