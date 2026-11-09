import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div id="konten" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}