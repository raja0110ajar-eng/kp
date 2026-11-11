import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { getPublicAssetUrl } from '@/lib/assets';

export interface HeroPhoto {
  path: string;
  alt: string;
}

function delay(ms: number) {
  return { animationDelay: `${ms}ms` };
}

export function Hero({ photos }: { photos: HeroPhoto[] }) {
  const { school } = siteConfig;
  const shown = photos.slice(0, 3);

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

        <div className="rise relative mx-auto w-full max-w-sm lg:max-w-none" style={delay(200)}>
          {shown.length > 0 ? (
            <div
              className={`grid aspect-[4/5] gap-3 ${
                shown.length === 1 ? 'grid-cols-1' : 'grid-cols-2 grid-rows-2'
              }`}
            >
              {shown.map((photo, index) => (
                <div
                  key={photo.path}
                  className={`relative overflow-hidden rounded-2xl bg-soft ${
                    shown.length === 2 || (shown.length === 3 && index === 0) ? 'row-span-2' : ''
                  }`}
                >
                  <Image
                    src={getPublicAssetUrl(photo.path)}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 28vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}