import { siteConfig } from '@/config/site';

export function TrustSection() {
  const { delivery, service, contact, limits } = siteConfig;

  const promises = [
    {
      title: 'Diantar sesuai jadwal',
      text: `${delivery.school.method}, ${delivery.school.schedule.toLowerCase()} (gratis). Luar sekolah: ${delivery.outside.weekdaySchedule.toLowerCase()}; ${delivery.outside.weekendSchedule.toLowerCase()}.`,
    },
    {
      title: `Pembayaran dikonfirmasi maksimal ${service.confirmationHours} jam`,
      text:
        contact.replyHours !== ''
          ? `Pada jam balas (${contact.replyHours.toLowerCase()}). Di luar jam itu, konfirmasi menunggu jam balas berikutnya.`
          : 'Pada jam balas admin.',
    },
    { title: 'Retur bila cacat atau rusak', text: delivery.returnPolicy },
  ];

  return (
    <section id="janji" className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Yang kami janjikan
          </h2>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {promises.map((promise) => (
              <div key={promise.title} className="py-4">
                <dt className="font-bold">{promise.title}</dt>
                <dd className="mt-1 leading-relaxed text-muted">{promise.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        {limits.length > 0 ? (
          <div>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Batas kami
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Kami usaha kelompok siswa, dan lebih baik jujur soal keterbatasan daripada menjanjikan
              terlalu banyak.
            </p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {limits.map((limit) => (
                <li key={limit} className="py-4 leading-relaxed text-ink-soft">
                  {limit}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}