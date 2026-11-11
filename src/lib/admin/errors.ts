const ERROR_MESSAGES: ReadonlyArray<readonly [string, string]> = [
  ['forbidden', 'Akses ditolak. Akunmu bukan admin.'],
  ['payment_not_found', 'Pembayaran tidak ditemukan.'],
  ['payment_not_awaiting_review', 'Pembayaran ini sudah diproses (mungkin oleh admin lain). Muat ulang halaman.'],
  ['order_cancelled', 'Pesanan ini sudah dibatalkan.'],
  ['order_not_found', 'Pesanan tidak ditemukan.'],
  ['order_already_final', 'Pesanan sudah berstatus akhir (selesai/dibatalkan) dan tidak bisa diubah.'],
  ['invalid_transition', 'Perubahan status ini tidak diizinkan dari status pesanan saat ini.'],
  ['status_not_allowed', 'Status yang dipilih tidak diizinkan.'],
  ['note_required', 'Catatan penolakan wajib diisi.'],
  ['products_slug_key', 'Slug sudah dipakai produk lain. Ganti slug-nya.'],
  ['shipping_zones_name_key', 'Nama zona sudah ada. Gunakan nama lain.'],
  ['categories_slug_key', 'Nama kategori ini terlalu mirip dengan kategori lain. Ubah sedikit namanya.'],
  ['categories_name_key', 'Nama kategori sudah dipakai.'],
  ['reviews_featured_approved_chk', 'Hanya ulasan yang disetujui yang bisa disorot di beranda.'],
  [
    'payment_settings_complete_when_active',
    'Metode tidak bisa diaktifkan: QRIS wajib punya gambar, metode lain wajib punya nomor rekening/akun.',
  ],
];

const FALLBACK_MESSAGE = 'Terjadi kesalahan tak terduga. Muat ulang halaman lalu coba lagi.';

export function getAdminErrorMessage(raw: string): string {
  const stock = raw.match(/insufficient_stock:\s*(.+)$/);
  if (stock) {
    return `Stok "${stock[1].trim()}" tidak cukup. Tambah stok produk dulu, lalu verifikasi lagi.`;
  }
  const found = ERROR_MESSAGES.find(([code]) => raw.includes(code));
  return found ? found[1] : FALLBACK_MESSAGE;
}