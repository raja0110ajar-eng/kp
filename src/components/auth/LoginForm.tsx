'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

const inputClass =
  'mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-3 text-base text-ink focus:border-primary';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Admin yang masuk tanpa tujuan khusus langsung diarahkan ke dashboard.
  async function goAfterLogin() {
    const supabase = createClient();
    const { data: isAdmin } = await supabase.rpc('is_admin');
    router.replace(isAdmin === true && next === '/' ? '/admin' : next);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage('Email atau password salah.');
        setLoading(false);
        return;
      }
      await goAfterLogin();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(`Pendaftaran gagal: ${error.message}`);
      setLoading(false);
      return;
    }
    if (data.session) {
      await goAfterLogin();
      return;
    }
    setMessage('Pendaftaran berhasil. Cek email kamu untuk konfirmasi, lalu masuk.');
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">{mode === 'signin' ? 'Masuk' : 'Daftar'}</h1>

      <label className="block text-sm font-medium">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium">
        Password
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>

      {message ? <p className="text-sm text-accent-ink">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {mode === 'signin' ? 'Masuk' : 'Daftar'}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setMessage(null);
        }}
        className="min-h-11 w-full text-sm text-muted underline"
      >
        {mode === 'signin' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </button>

      <Link href="/" className="block text-center text-sm font-semibold text-link underline">
        Kembali ke toko
      </Link>
    </form>
  );
}