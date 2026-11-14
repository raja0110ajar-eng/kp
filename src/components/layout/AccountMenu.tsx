'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogIn, LogOut, ReceiptText, User } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { createClient } from '@/lib/supabase/client';

type AccountState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'user'; email: string | null; isAdmin: boolean };

const itemClass =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition hover:bg-soft';

export function AccountMenu() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountState>({ status: 'loading' });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        if (!cancelled) setAccount({ status: 'guest' });
        return;
      }
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (!cancelled) {
        setAccount({ status: 'user', email: session.user.email ?? null, isAdmin: isAdmin === true });
      }
    }

    void refresh();
    // Jangan memanggil Supabase langsung di dalam callback ini: tunda lewat setTimeout.
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  const isGuest = account.status === 'guest';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isGuest ? 'Menu akun: masuk' : 'Menu akun'}
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition hover:bg-soft"
      >
        <User className="h-5 w-5" aria-hidden />
        {isGuest ? <span className="hidden sm:inline">Masuk</span> : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl"
        >
          {account.status === 'user' ? (
            <>
              {account.email ? (
                <p className="truncate px-3 pb-2 pt-1 text-xs text-muted">{account.email}</p>
              ) : null}
              {account.isAdmin ? (
                <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={`${itemClass} text-link`}>
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Dashboard admin
                </Link>
              ) : null}
              <Link role="menuitem" href="/orders" onClick={() => setOpen(false)} className={itemClass}>
                <ReceiptText className="h-4 w-4" aria-hidden />
                Pesanan saya
              </Link>
              <button type="button" role="menuitem" onClick={handleSignOut} className={itemClass}>
                <LogOut className="h-4 w-4" aria-hidden />
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link role="menuitem" href="/login" onClick={() => setOpen(false)} className={itemClass}>
                <LogIn className="h-4 w-4" aria-hidden />
                Masuk atau daftar
              </Link>
              <Link role="menuitem" href="/orders" onClick={() => setOpen(false)} className={itemClass}>
                <ReceiptText className="h-4 w-4" aria-hidden />
                Lacak pesanan
              </Link>
            </>
          )}

          <div className="mt-2 border-t border-line px-3 pb-2 pt-3 sm:hidden">
            <p className="mb-2 text-xs font-semibold text-muted">Tema</p>
            <ThemeToggle size="lg" />
          </div>
        </div>
      ) : null}
    </div>
  );
}