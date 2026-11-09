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

export function recallOrderPhone(orderCode: string): string | null {
  try {
    return window.sessionStorage.getItem(storageKey(orderCode));
  } catch {
    return null;
  }
}