import { siteConfig } from '@/config/site';

export function InnovationShowcase() {
  if (siteConfig.partners.length === 0) return null;

  return (
    <section id="inovasi" className="bg-soft py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Karya inovasi: teknologi untuk sesama
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Selain kriya, tim kami mengembangkan teknologi. Kami menyebut statusnya apa adanya, termasuk
          apa yang belum bisa dilakukan.
        </p>

        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {siteConfig.partners.map((partner) => (
            <li key={partner.name} className="rounded-2xl border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-extrabold">{partner.name}</h3>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
                  {partner.status}
                </span>
              </div>
              <p className="mt-3 leading-relaxed text-ink-soft">{partner.description}</p>
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-line-strong px-5 font-semibold transition hover:bg-soft"
              >
                Buka situs {partner.name}
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-muted">Situs toko ini juga dibuat oleh tim kami.</p>
      </div>
    </section>
  );
}