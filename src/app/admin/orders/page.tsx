import Link from 'next/link';
import { Search } from 'lucide-react';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { cardClass, inputClass, primaryButtonClass } from '@/components/admin/styles';
import { ORDERS_PAGE_SIZE, getAdminOrders } from '@/lib/admin/queries';
import {
  DELIVERY_AREA_LABEL,
  ORDER_STATUS_META,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_LABEL,
  VERIFICATION_META,
} from '@/lib/admin/labels';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { firstParam, type RawSearchParams } from '@/lib/search-params';
import type { OrderStatus } from '@/types/domain';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;

  const rawStatus = firstParam(params.status);
  const status: OrderStatus | null =
    ORDER_STATUS_VALUES.find((candidate) => candidate === rawStatus) ?? null;
  const search = firstParam(params.q).trim().slice(0, 40);
  const parsedPage = Number.parseInt(firstParam(params.page), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const list = await getAdminOrders({ status, search, page });

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Pesanan</h1>
        <p className="text-sm text-muted">{list.total} pesanan ditemukan.</p>
      </header>

      <form action="/admin/orders" method="get" className={`${cardClass} flex flex-wrap items-end gap-3`}>
        <label className="block text-sm font-medium">
          Status
          <select name="status" defaultValue={status ?? ''} className={inputClass}>
            <option value="">Semua status</option>
            {ORDER_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_META[value].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-48 flex-1 text-sm font-medium">
          Cari (kode, nama, atau nomor HP)
          <input type="search" name="q" defaultValue={search} maxLength={40} className={inputClass} />
        </label>
        <button type="submit" className={primaryButtonClass}>
          <Search className="h-4 w-4" aria-hidden />
          Terapkan
        </button>
      </form>

      {list.items.length === 0 ? (
        <p className="rounded-2xl bg-surface p-10 text-center text-muted">
          Tidak ada pesanan yang cocok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Pembeli</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pembayaran</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((order) => {
                const orderMeta = ORDER_STATUS_META[order.status];
                const verification = order.verificationStatus
                  ? VERIFICATION_META[order.verificationStatus]
                  : null;
                return (
                  <tr key={order.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={`/admin/orders/${order.id}`} className="text-link hover:underline">
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{order.customerName}</p>
                      <p className="text-xs text-muted">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">{DELIVERY_AREA_LABEL[order.deliveryArea]}</td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(order.total)}</td>
                    <td className="space-y-1 px-4 py-3">
                      <p>{order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] : '-'}</p>
                      {verification ? (
                        <StatusBadge tone={verification.tone}>{verification.label}</StatusBadge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={orderMeta.tone}>{orderMeta.label}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDateTime(order.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/admin/orders"
        params={{ status: status ?? '', q: search }}
        page={list.page}
        pageSize={ORDERS_PAGE_SIZE}
        total={list.total}
      />
    </main>
  );
}