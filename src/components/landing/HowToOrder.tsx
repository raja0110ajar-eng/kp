const STEPS = [
  {
    title: 'Pilih produk',
    description: 'Telusuri katalog, lalu tambahkan produk favoritmu ke keranjang.',
  },
  {
    title: 'Checkout',
    description: 'Isi data, pilih pengiriman area sekolah atau luar sekolah, lalu pilih metode pembayaran.',
  },
  {
    title: 'Bayar dan unggah bukti',
    description:
      'Transfer lalu unggah screenshot bukti, atau pilih COD dan bayar tunai saat pesanan diterima.',
  },
  {
    title: 'Lacak pesanan',
    description: 'Pantau status pesananmu kapan saja dengan kode pesanan dan nomor HP.',
  },
] as const;

export function HowToOrder() {
  return (
    <section id="cara-pesan" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Memesan dalam empat langkah
        </h2>

        <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-line-strong pt-5">
              <span className="text-3xl font-extrabold text-accent-ink">{index + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}