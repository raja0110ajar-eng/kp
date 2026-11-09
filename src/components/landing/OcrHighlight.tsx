const FLOW = [
  { title: 'Unggah bukti', description: 'Kamu mengunggah screenshot bukti transfer.' },
  { title: 'Dibaca otomatis', description: 'Teks dan nominal dibaca langsung di browsermu dengan OCR.' },
  { title: 'Dicocokkan', description: 'Nominal dibandingkan dengan total pesananmu.' },
  { title: 'Dikonfirmasi admin', description: 'Admin memeriksa hasilnya dan memutuskan.' },
] as const;

export function OcrHighlight() {
  return (
    <section id="verifikasi-ai" className="on-inverse bg-inverse py-16 text-white sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          Bukti transfer dibaca otomatis dengan AI OCR
        </h2>
        <p className="mt-5 max-w-2xl leading-relaxed text-white/80">
          Teknologi membantu membaca nominal pada bukti transfer, sementara keputusan akhir tetap di
          tangan admin. Bukti yang kamu unggah disimpan privat dan hanya bisa dilihat admin.
        </p>

        <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((step, index) => (
            <li key={step.title} className="border-t border-white/25 pt-5">
              <span className="text-2xl font-extrabold text-inverse-accent">{index + 1}</span>
              <h3 className="mt-2 font-bold">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}