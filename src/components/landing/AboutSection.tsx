import { siteConfig } from '@/config/site';

export function AboutSection() {
  return (
    <section id="tentang" className="on-inverse bg-inverse py-16 text-white sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          Wadah kolaborasi kreatif berbasis vokasi
        </h2>

        {siteConfig.nameMeaning !== '' ? (
          <div className="mt-8 max-w-3xl border-l-2 border-white/40 pl-5">
            <p className="font-semibold">Arti nama Karsa Pandiga</p>
            <p className="mt-1 text-lg leading-relaxed text-white/85">{siteConfig.nameMeaning}</p>
          </div>
        ) : null}

        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-white/80">
          {siteConfig.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <dl className="mt-14 grid gap-x-10 gap-y-8 border-t border-white/20 pt-8 md:grid-cols-3">
          {siteConfig.values.map((value) => (
            <div key={value.title}>
              <dt className="text-lg font-bold">{value.title}</dt>
              <dd className="mt-2 leading-relaxed text-white/75">{value.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}