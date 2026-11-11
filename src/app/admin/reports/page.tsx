import Link from 'next/link';
import { AlertTriangle, Download } from 'lucide-react';
import { BusinessSettingsForm } from '@/components/admin/BusinessSettingsForm';
import { cardClass, secondaryButtonClass } from '@/components/admin/styles';
import { REPORT_RANGES, getSalesReport, parseRange } from '@/lib/admin/reports';
import { formatRupiah } from '@/lib/format';
import { firstParam, type RawSearchParams } from '@/lib/search-params';

function percent(value: number | null): string {
  return value === null ? '-' : `${value.toFixed(1).replace('.', ',')}%`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const range = parseRange(firstParam(params.range));
  const report = await getSalesReport(range);

  const cards = [
    { label: 'Omzet barang', value: formatRupiah(report.goodsRevenue), note: `${report.verifiedOrders} pesanan terverifikasi` },
    {
      label: 'Laba kotor',
      value: formatRupiah(report.grossProfit),
      note: `margin ${percent(report.marginPercent)}`,
    },
    {
      label: 'Laba setelah ongkir',
      value: formatRupiah(report.profitAfterDelivery),
      note: 'laba kotor + ongkir diterima − biaya antar',
    },
    {
      label: 'Rata-rata nilai pesanan',
      value: report.averageOrderValue === null ? '-' : formatRupiah(report.averageOrderValue),
      note: 'barang + ongkir',
    },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Laporan</h1>
          <p className="text-sm text-muted">
            Keuangan dihitung dari pembayaran terverifikasi yang tidak dibatalkan, berdasarkan tanggal
            verifikasi.
          </p>
        </div>
        <a href={`/admin/reports/export?range=${range}`} className={secondaryButtonClass} download>
          <Download className="h-4 w-4" aria-hidden />
          Ekspor CSV
        </a>
      </header>

      <nav aria-label="Rentang waktu" className="flex flex-wrap gap-2">
        {REPORT_RANGES.map((item) => (
          <Link
            key={item.value}
            href={`/admin/reports?range=${item.value}`}
            aria-current={item.value === range ? 'page' : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              item.value === range
                ? 'border-primary bg-primary text-white'
                : 'border-line-strong bg-surface hover:bg-soft'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={cardClass}>
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{card.value}</p>
            <p className="mt-1 text-xs text-muted">{card.note}</p>
          </div>
        ))}
      </section>

      {report.costCoveragePercent !== null && report.costCoveragePercent < 100 ? (
        <p className="flex items-start gap-2 rounded-xl border border-accent bg-accent/5 p-4 text-sm text-ink-soft">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
          HPP baru terisi untuk {percent(report.costCoveragePercent)} dari omzet. Laba kotor hanya menghitung
          item yang HPP-nya terisi, jadi angkanya belum lengkap. Lengkapi biaya produk di menu Produk.
          HPP tercatat saat pembayaran diverifikasi, jadi pesanan yang diverifikasi sebelum biaya diisi
          tetap tanpa HPP.
        </p>
      ) : null}

      <section className={`${cardClass} space-y-3`}>
        <h2 className="text-lg font-bold">Rincian keuangan</h2>
        <dl className="divide-y divide-line text-sm">
          {[
            ['Omzet barang', formatRupiah(report.goodsRevenue)],
            ['Omzet barang yang HPP-nya terisi', formatRupiah(report.revenueWithCost)],
            ['HPP (bahan + kemasan + tenaga)', formatRupiah(report.knownCost)],
            ['Laba kotor', formatRupiah(report.grossProfit)],
            ['Ongkir diterima dari pembeli', formatRupiah(report.shippingIncome)],
            ['Biaya antar internal (asumsi)', formatRupiah(report.deliveryCost)],
            ['Laba setelah ongkir', formatRupiah(report.profitAfterDelivery)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2">
              <dt className="text-muted">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={`${cardClass} space-y-3`}>
          <h2 className="text-lg font-bold">Corong pesanan</h2>
          <p className="text-xs text-muted">Berdasarkan tanggal pesanan dibuat.</p>
          <dl className="divide-y divide-line text-sm">
            {[
              ['Pesanan dibuat', String(report.funnel.created)],
              ['Menunggu bayar atau verifikasi', String(report.funnel.pending)],
              ['Lolos verifikasi (diproses sampai selesai)', String(report.funnel.verifiedProgress)],
              ['Dibatalkan', String(report.funnel.cancelled)],
              ['Tingkat konversi', percent(report.funnel.conversionPercent)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${cardClass} space-y-3`}>
          <h2 className="text-lg font-bold">Janji konfirmasi pembayaran</h2>
          <p className="text-xs text-muted">
            Diukur dari bukti diunggah sampai diverifikasi (transfer saja). Janji di situs:{' '}
            {report.confirmation.promiseHours} jam.
          </p>
          {report.confirmation.samples === 0 ? (
            <p className="text-sm text-muted">Belum ada data pada rentang ini.</p>
          ) : (
            <dl className="divide-y divide-line text-sm">
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted">Jumlah sampel</dt>
                <dd className="font-semibold">{report.confirmation.samples}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted">Rata-rata waktu konfirmasi</dt>
                <dd className="font-semibold">
                  {report.confirmation.averageHours === null
                    ? '-'
                    : `${report.confirmation.averageHours.toFixed(1).replace('.', ',')} jam`}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted">Terkonfirmasi dalam janji</dt>
                <dd className="font-semibold">{percent(report.confirmation.withinPromisePercent)}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>

      <section className={`${cardClass} space-y-3`}>
        <h2 className="text-lg font-bold">Per produk</h2>
        {report.products.length === 0 ? (
          <p className="text-sm text-muted">Belum ada penjualan pada rentang ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-4">Produk</th>
                  <th className="py-2 pr-4">Terjual</th>
                  <th className="py-2 pr-4">Omzet</th>
                  <th className="py-2 pr-4">HPP</th>
                  <th className="py-2 pr-4">Laba kotor</th>
                  <th className="py-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((row) => (
                  <tr key={row.productId} className="border-b border-line last:border-0">
                    <td className="py-2 pr-4 font-semibold">{row.name}</td>
                    <td className="py-2 pr-4">{row.units}</td>
                    <td className="py-2 pr-4">{formatRupiah(row.revenue)}</td>
                    <td className="py-2 pr-4">{formatRupiah(row.cost)}</td>
                    <td className="py-2 pr-4">{formatRupiah(row.profit)}</td>
                    <td className="py-2">
                      {percent(row.marginPercent)}
                      {!row.fullyCosted ? (
                        <span className="ml-2 text-xs text-accent-ink">HPP belum lengkap</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BusinessSettingsForm settings={report.settings} />
    </main>
  );
}