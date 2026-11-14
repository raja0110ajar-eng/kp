import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

function delay(ms: number) {
  return { animationDelay: `${ms}ms` };
}

export function Hero() {
  const { school } = siteConfig;

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1
            className="rise text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            style={delay(0)}
          >
            {siteConfig.heroHeadline}
          </h1>
          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted" style={delay(120)}>
            {siteConfig.heroDescription}
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={delay(240)}>
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center rounded-lg bg-primary px-6 font-semibold text-white transition hover:bg-primary-hover"
            >
              Lihat katalog
            </Link>
            <Link
              href="/orders"
              className="inline-flex min-h-12 items-center rounded-lg border border-line-strong px-6 font-semibold transition hover:bg-soft"
            >
              Lacak pesanan
            </Link>
          </div>
          <p className="rise mt-10 text-sm text-muted" style={delay(360)}>
            Dari {school.programName} {school.name}, {school.city}
          </p>
        </div>

        <div className="rise relative mx-auto w-full max-w-xs lg:max-w-sm" style={delay(200)}>
          <div aria-hidden className="absolute -inset-4 rounded-[2.75rem] border border-accent/40" />
          <Image
            src="/logo.png"
            alt="Logo Karsa Pandiga: bintang dan api di atas obor"
            width={384}
            height={384}
            sizes="(min-width: 1024px) 384px, 70vw"
            loading="eager"
            className="relative h-auto w-full rounded-[22%] shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}