import { getSavedPhone } from '@/lib/orders/saved-orders';

// Nomor HP disimpan sementara di sessionStorage (hilang saat tab ditutup)
// agar guest tidak perlu mengetik ulang di halaman upload bukti. Tidak pernah ditaruh di URL.
function storageKey(orderCode: string): string {
  return `kp:order-phone:${orderCode.toUpperCase()}`;
}

export function rememberOrderPhone(orderCode: string, phone: string): void {
  try {
    window.sessionStorage.setItem(storageKey(orderCode), phone);
  } catch {
    // Storage bisa diblokir (mode privat ketat). Aman diabaikan: pembeli akan diminta mengisi nomor HP.
  }
}

/** Mencari nomor HP untuk sebuah pesanan: sesi tab ini dulu, lalu daftar pesanan di perangkat ini. */
export function recallOrderPhone(orderCode: string): string | null {
  try {
    const fromSession = window.sessionStorage.getItem(storageKey(orderCode));
    if (fromSession) return fromSession;
  } catch {
    // Lanjut ke daftar perangkat.
  }
  return getSavedPhone(orderCode.toUpperCase());
}