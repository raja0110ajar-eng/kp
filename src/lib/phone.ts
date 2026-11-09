// Harus sama dengan fungsi SQL public.normalize_phone() dan constraint orders_customer_phone_check.
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^0-9]/g, '');
  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits;
}

export function isValidPhone(input: string): boolean {
  return /^08[0-9]{8,11}$/.test(normalizePhone(input));
}

/** Tautan WhatsApp (wa.me) untuk nomor seluler Indonesia. String kosong jika nomor tidak valid. */
export function toWhatsAppUrl(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!/^08[0-9]{8,11}$/.test(normalized)) return '';
  return `https://wa.me/62${normalized.slice(1)}`;
}