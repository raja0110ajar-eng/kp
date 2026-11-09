'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Muat ulang data dari server, lalu coba render ulang bagian yang gagal.
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Halaman ini gagal dimuat</h1>
      <p className="mt-3 text-muted">
        Terjadi gangguan saat memuat halaman. Coba lagi. Kalau masih gagal, hubungi admin dan sebutkan
        kode di bawah.
      </p>
      {error.digest ? <p className="mt-3 text-xs text-muted">Kode kesalahan: {error.digest}</p> : null}
      <button
        type="button"
        onClick={retry}
        disabled={pending}
        className="mt-8 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? 'Memuat ulang…' : 'Coba lagi'}
      </button>
    </main>
  );
}