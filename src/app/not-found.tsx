import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';

export default function NotFound() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-6xl font-extrabold tracking-tight text-accent-ink">404</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-muted">
          Alamat yang kamu buka tidak ada atau sudah dipindahkan. Periksa penulisan alamatnya, atau
          lanjut dari beranda.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
          >
            Ke beranda
          </Link>
          <Link
            href="/products"
            className="rounded-lg border border-line-strong px-5 py-2.5 font-semibold transition hover:bg-soft"
          >
            Lihat katalog
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}