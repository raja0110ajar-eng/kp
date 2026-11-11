'use client';

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
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ITEMS = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard, exact: true },
  { href: '/admin/payments', label: 'Verifikasi', icon: BadgeCheck, exact: false },
  { href: '/admin/orders', label: 'Pesanan', icon: ReceiptText, exact: false },
  { href: '/admin/products', label: 'Produk', icon: Package, exact: false },
  { href: '/admin/categories', label: 'Kategori', icon: Tags, exact: false },
  { href: '/admin/reviews', label: 'Ulasan', icon: Star, exact: false },
  { href: '/admin/reports', label: 'Laporan', icon: FileText, exact: false },
  { href: '/admin/shipping', label: 'Tarif kurir', icon: Truck, exact: false },
  { href: '/admin/payment-settings', label: 'Setelan bayar', icon: Wallet, exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

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
            </Link>
          );
        })}
      </nav>

      <div className="hidden px-2 pb-4 pt-4 md:block">
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