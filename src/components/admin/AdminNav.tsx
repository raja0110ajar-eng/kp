'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Star,
  Tags,
  Truck,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ITEMS = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard, exact: true, badge: null },
  { href: '/admin/payments', label: 'Verifikasi', icon: BadgeCheck, exact: false, badge: 'verify' },
  { href: '/admin/orders', label: 'Pesanan', icon: ReceiptText, exact: false, badge: null },
  { href: '/admin/products', label: 'Produk', icon: Package, exact: false, badge: null },
  { href: '/admin/categories', label: 'Kategori', icon: Tags, exact: false, badge: null },
  { href: '/admin/reviews', label: 'Ulasan', icon: Star, exact: false, badge: 'reviews' },
  { href: '/admin/reports', label: 'Laporan', icon: FileText, exact: false, badge: null },
  { href: '/admin/shipping', label: 'Tarif kurir', icon: Truck, exact: false, badge: null },
  { href: '/admin/payment-settings', label: 'Setelan bayar', icon: Wallet, exact: false, badge: null },
] as const;

const POLL_MS = 30_000;
const SOUND_KEY = 'kp:admin-sound';
const BASE_TITLE = 'Dashboard admin | Karsa Pandiga';
const CHIME_TONES: ReadonlyArray<readonly [number, number]> = [
  [880, 0],
  [1175, 0.18],
];

interface Counts {
  verify: number;
  reviews: number;
}

function playChime() {
  try {
    const Context =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;

    const context = new Context();
    const start = context.currentTime;
    for (const [frequency, offset] of CHIME_TONES) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.4);
    }
    setTimeout(() => void context.close(), 900);
  } catch {
    // Browser menahan suara: lencana dan judul tab tetap bekerja.
  }
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const previousVerify = useRef<number | null>(null);

  useEffect(() => {
    try {
      setSoundOn(window.localStorage.getItem(SOUND_KEY) === '1');
    } catch {
      // Storage diblokir: bunyi tetap mati.
    }
  }, []);

  const loadCounts = useCallback(async () => {
    const supabase = createClient();
    const [verify, reviews] = await Promise.all([
      supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'awaiting_review'),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    if (verify.error || reviews.error) return;
    setCounts({ verify: verify.count ?? 0, reviews: reviews.count ?? 0 });
  }, []);

  useEffect(() => {
    void loadCounts();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void loadCounts();
    }, POLL_MS);
    const handleFocus = () => void loadCounts();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadCounts]);

  // Judul tab menampilkan jumlah yang perlu diverifikasi.
  useEffect(() => {
    if (!counts) return;
    document.title = counts.verify > 0 ? `(${counts.verify}) ${BASE_TITLE}` : BASE_TITLE;
  }, [counts, pathname]);

  // Bunyi hanya saat jumlah naik setelah pemuatan pertama.
  useEffect(() => {
    if (!counts) return;
    if (previousVerify.current !== null && counts.verify > previousVerify.current && soundOn) {
      playChime();
    }
    previousVerify.current = counts.verify;
  }, [counts, soundOn]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    try {
      window.localStorage.setItem(SOUND_KEY, next ? '1' : '0');
    } catch {
      // Storage diblokir: pilihan hanya berlaku selama tab terbuka.
    }
    if (next) playChime();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-3 md:block md:py-5">
        <Link href="/admin" className="text-lg font-extrabold tracking-tight text-link">
          Karsa Pandiga
          <span className="ml-2 text-xs font-semibold text-muted">Admin</span>
        </Link>
      </div>

      <nav
        aria-label="Navigasi admin"
        className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-0"
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const badgeValue = item.badge && counts ? counts[item.badge] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active ? 'bg-primary text-white' : 'text-ink-soft hover:bg-soft'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
              {badgeValue > 0 ? (
                <span
                  className="ml-auto min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-bold text-white"
                  aria-label={`${badgeValue} perlu perhatian`}
                >
                  {badgeValue}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-2 pb-4 pt-4 max-md:hidden">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-soft"
        >
          {soundOn ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
          Bunyi notifikasi: {soundOn ? 'aktif' : 'mati'}
        </button>
        <Link
          href="/"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-soft"
        >
          Lihat situs
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-soft"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Keluar
        </button>
      </div>
    </aside>
  );
}