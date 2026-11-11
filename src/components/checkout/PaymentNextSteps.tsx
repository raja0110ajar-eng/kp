import { siteConfig } from '@/config/site';
import { formatRupiah } from '@/lib/format';

export function PaymentNextSteps({ expectedAmount }: { expectedAmount: number }) {
  const { service, contact } = siteConfig;

  const steps = [
    `Bayar sesuai total ${formatRupiah(expectedAmount)} ke tujuan di bawah. Nominal yang sama membuat buktimu lebih cepat dikenali.`,
    'Unggah screenshot bukti transfer di bagian bawah halaman ini.',
    `Kami konfirmasi maksimal ${service.confirmationHours} jam${
      contact.replyHours !== '' ? ` pada jam balas (${contact.replyHours.toLowerCase()})` : ''
    }. Statusnya bisa kamu pantau di halaman pesanan.`,
  ];

  return (
    <section aria-label="Langkah selanjutnya" className="rounded-2xl bg-soft p-5">
      <h2 className="font-bold">Selanjutnya apa?</h2>
      <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="font-extrabold text-accent-ink">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}