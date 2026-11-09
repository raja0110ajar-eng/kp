'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#ffffff',
          color: '#0d0d0d',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <main style={{ maxWidth: '28rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Situs sedang bermasalah</h1>
          <p style={{ marginTop: '0.75rem', color: '#5b6573' }}>
            Terjadi gangguan serius. Coba muat ulang. Kalau masih gagal, hubungi admin Karsa Pandiga.
          </p>
          {error.digest ? (
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#5b6573' }}>
              Kode kesalahan: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              padding: '0.625rem 1.25rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: '#123454',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Muat ulang
          </button>
        </main>
      </body>
    </html>
  );
}