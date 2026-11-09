// Akses env HARUS literal (process.env.NAMA) agar Next.js bisa meng-inline-nya ke bundle browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Env Supabase belum diisi: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (lihat .env.example).'
  );
}

export const supabaseEnv = { url, key } as const;