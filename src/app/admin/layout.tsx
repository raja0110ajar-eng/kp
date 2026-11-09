import type { ReactNode } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/auth/require-admin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="admin-light min-h-screen bg-soft text-ink md:flex">
      <AdminNav />
      <div id="konten" className="min-w-0 flex-1 px-4 py-6 md:px-8">
        {children}
      </div>
    </div>
  );
}