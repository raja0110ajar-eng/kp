'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartIndicator } from '@/components/cart/CartIndicator';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const NAV = [
  { href: '/products', short: 'Katalog', long: 'Katalog' },
  { href: '/orders', short: 'Pesanan', long: 'Lacak pesanan' },
] as const;

const SCROLL_THRESHOLD = 8;
const ALWAYS_VISIBLE_BELOW = 80;

export function SiteHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    function handleScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (y < ALWAYS_VISIBLE_BELOW) setHidden(false);
      else if (delta > SCROLL_THRESHOLD) setHidden(true);
      else if (delta < -SCROLL_THRESHOLD) setHidden(false);

      if (Math.abs(delta) > SCROLL_THRESHOLD || y < ALWAYS_VISIBLE_BELOW) lastY.current = y;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur transition-transform duration-300 focus-within:translate-y-0 motion-reduce:transition-none ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <BrandLogo compact />

        <div className="flex items-center gap-0.5 sm:gap-2">
          <nav aria-label="Navigasi utama" className="flex items-center">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex min-h-11 items-center px-2.5 text-sm font-semibold after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent after:transition-transform after:duration-300 motion-reduce:after:transition-none sm:px-3 sm:after:inset-x-3 ${
                    active ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
                  }`}
                >
                  <span className="sm:hidden">{item.short}</span>
                  <span className="hidden sm:inline">{item.long}</span>
                </Link>
              );
            })}
          </nav>
          <CartIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}