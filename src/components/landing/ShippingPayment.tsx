import { siteConfig } from '@/config/site';

const PAYMENT_METHODS = [
  { name: 'QRIS', description: 'Pindai kode QRIS, lalu unggah bukti pembayaran.' },
  { name: 'E-wallet', description: 'DANA, OVO, atau GoPay.' },
  { name: 'Transfer bank', description: 'Ke rekening yang tampil setelah checkout.' },
  { name: 'COD', description: 'Bayar tunai saat pesanan diterima.' },
] as const;

export function ShippingPayment() {
  const { delivery } = siteConfig;

  return (
    <section id="pengiriman" className="bg-soft py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Diantar langsung oleh tim kami
          </h2>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            <div className="py-4">
              <dt className="font-bold">Area sekolah</dt>
              <dd className="mt-1 leading-relaxed text-muted">
                {delivery.school.method}. {delivery.school.schedule}. Gratis.
              </dd>
            </div>
            <div className="py-4">
              <dt className="font-bold">Luar sekolah</dt>
              <dd className="mt-1 leading-relaxed text-muted">
                {delivery.outside.weekdaySchedule}. {delivery.outside.weekendSchedule}. Tarif mengikuti
                zona dan tampil di halaman checkout.
              </dd>
            </div>
          </dl>
          <p className="mt-6 border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted">
            <span className="font-semibold text-ink">Pembatalan dan retur.</span> {delivery.returnPolicy}
          </p>
        </div>

        <div>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Pembayaran yang fleksibel
          </h2>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {PAYMENT_METHODS.map((method) => (
              <div key={method.name} className="py-4">
                <dt className="font-bold">{method.name}</dt>
                <dd className="mt-1 leading-relaxed text-muted">{method.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}