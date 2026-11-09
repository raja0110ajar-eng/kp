import Link from 'next/link';
import { AlertTriangle, BadgeCheck, PackageX, Truck, Wallet } from 'lucide-react';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
import { cardClass } from '@/components/admin/styles';
import { getDashboardSummary } from '@/lib/admin/queries';
import { formatRupiah } from '@/lib/format';

export default async function AdminHomePage() {
  const summary = await getDashboardSummary();

  const cards = [
    {
      href: '/admin/payments',
      label: 'Menunggu verifikasi',
      value: summary.awaitingReview,
      icon: BadgeCheck,
      highlight: summary.awaitingReview > 0,
    },
    {
      href: '/admin/orders?status=processing',
      label: 'Pesanan diproses',
      value: summary.processing,
      icon: Wallet,
      highlight: false,
    },
    {
      href: '/admin/orders?status=delivering',
      label: 'Sedang diantar',
      value: summary.delivering,
      icon: Truck,
      highlight: false,
    },
    {
      href: '/admin/products',
      label: 'Stok menipis (5 atau kurang)',
      value: summary.lowStock,
      icon: PackageX,
      highlight: summary.lowStock > 0,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Ringkasan</h1>
        <AutoRefresh />
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`${cardClass} transition hover:shadow-md ${
                card.highlight ? 'border-[#FF6B00]' : ''
              }`}
            >
              <Icon
                className={`h-5 w-5 ${card.highlight ? 'text-[#FF6B00]' : 'text-[#0066FF]'}`}
                aria-hidden
              />
              <p className="mt-3 text-3xl font-extrabold">{card.value}</p>
              <p className="text-sm text-neutral-600">{card.label}</p>
            </Link>
          );
        })}
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold">Penjualan terverifikasi</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-3xl font-extrabold text-[#0066FF]">{summary.verifiedOrders}</p>
            <p className="text-sm text-neutral-600">Pesanan terverifikasi (tidak dibatalkan)</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-[#0066FF]">{formatRupiah(summary.revenue)}</p>
            <p className="text-sm text-neutral-600">Omzet (total pesanan, belum dikurangi modal)</p>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Untuk COD, pesanan dihitung saat admin mengonfirmasinya, belum tentu uang tunai sudah diterima.
        </p>
      </section>
    </main>
  );
}