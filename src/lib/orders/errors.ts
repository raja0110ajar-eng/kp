// Urutan penting: kode yang lebih spesifik ditaruh lebih dulu.
const ERROR_MESSAGES: ReadonlyArray<readonly [string, string]> = [
  [
    'too_many_attempts',
    'Terlalu banyak percobaan yang tidak cocok. Tunggu sekitar 15 menit lalu coba lagi, atau hubungi admin lewat WhatsApp.',
  ],
  [
    'too_many_orders',
    'Terlalu banyak pesanan dari jaringan ini dalam satu jam terakhir. Coba lagi nanti, atau hubungi admin lewat WhatsApp.',
  ],
  [
    'row-level security',
    'Unggahan ditolak. Batas unggahan untuk pesanan ini mungkin sudah tercapai, atau pesanan sudah diproses. Hubungi admin lewat WhatsApp.',
  ],
  ['insufficient_stock', 'Stok salah satu produk tidak mencukupi. Periksa kembali keranjangmu.'],
  ['product_unavailable', 'Salah satu produk sudah tidak tersedia. Periksa kembali keranjangmu.'],
  ['payment_method_unavailable', 'Metode pembayaran ini sedang tidak tersedia. Pilih metode lain.'],
  ['invalid_phone', 'Nomor HP tidak valid. Gunakan nomor seluler Indonesia, contoh 081234567890.'],
  ['invalid_name', 'Nama wajib diisi.'],
  ['invalid_address', 'Alamat atau lokasi pengantaran wajib diisi.'],
  ['invalid_zone', 'Zona pengiriman tidak valid atau sedang tidak aktif.'],
  ['invalid_items', 'Isi keranjang tidak valid.'],
  ['duplicate_items', 'Ada produk yang terdaftar dua kali di keranjang.'],
  ['order_not_found', 'Pesanan tidak ditemukan. Periksa kode pesanan dan nomor HP.'],
  ['order_cancelled', 'Pesanan ini sudah dibatalkan.'],
  ['payment_is_cod', 'Pesanan COD tidak memerlukan bukti transfer.'],
  ['payment_locked', 'Pembayaran sudah terverifikasi, tidak bisa mengunggah bukti lagi.'],
  ['proof_not_uploaded', 'File bukti belum tersimpan di server. Coba unggah ulang.'],
  ['invalid_proof_path', 'Lokasi file bukti tidak valid. Coba unggah ulang.'],
  ['not_image', 'File harus berupa gambar (JPG, PNG, atau WebP).'],
  ['too_large', 'Ukuran gambar terlalu besar. Gunakan screenshot dengan resolusi lebih kecil.'],
  ['decode_failed', 'Gambar tidak bisa dibaca. Coba format JPG atau PNG.'],
  ['encode_failed', 'Gambar gagal diproses di browser ini.'],
  ['Failed to fetch', 'Koneksi internet bermasalah. Coba lagi.'],
];

const FALLBACK_MESSAGE = 'Terjadi kesalahan tak terduga. Coba lagi, atau hubungi admin Karsa Pandiga.';

export function getOrderErrorMessage(raw: string): string {
  const found = ERROR_MESSAGES.find(([code]) => raw.includes(code));
  return found ? found[1] : FALLBACK_MESSAGE;
}