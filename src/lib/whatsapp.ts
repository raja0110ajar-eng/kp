import { normalizePhone } from '@/lib/phone';

/** Tautan WhatsApp (wa.me) untuk nomor seluler Indonesia. String kosong jika nomor tidak valid. */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  if (!/^08[0-9]{8,11}$/.test(normalized)) return '';

  const base = `https://wa.me/62${normalized.slice(1)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}