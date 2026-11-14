import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SavedOrdersPanel } from '@/components/orders/SavedOrdersPanel';
import { TrackLookupForm } from '@/components/orders/TrackLookupForm';
import { PAYMENT_METHOD_LABEL } from '@/lib/admin/labels';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { BUYER_ORDER_STATUS } from '@/lib/orders/labels';
import { formatOrderCode } from '@/lib/orders/order-code';
import {
  MY_ORDERS_PAGE_SIZE,
  getCurrentUserId,
  getMyOrders,
} from '@/lib/orders/my-orders';
import { firstParam, type RawSearchParams } from '@/lib/search-params';

export const metadata: Metadata = {
  title: 'Pesanan | Karsa Pandiga',
  robots: { index: false, follow: false },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(firstParam(params.page), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const userId = await getCurrentUserId();
  const list = userId ? await getMyOrders(userId, page) : null;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Pesanan</h1>
        <p className="text-sm text-muted">
          {list
            ? 'Pesanan yang kamu buat saat login ada di bawah ini.'
            : 'Lacak pesananmu tanpa perlu login.'}
        </p>
      </header>

      <SavedOrdersPanel />

      {list ? (
        <section className="space-y-4" aria-label="Daftar pesanan saya">
          {list.items.length === 0 ? (
            <p className="rounded-2xl bg-soft p-8 text-center text-muted">
              Belum ada pesanan atas akun ini. Pesanan yang dibuat sebelum login atau tanpa login bisa
              dilacak lewat kode pesanan di bawah.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.items.map((order) => {
                const meta = BUYER_ORDER_STATUS[order.status];
                return (
                  <li key={order.orderCode}>
                    <Link
                      href={`/orders/${order.orderCode}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:shadow-md"
                    >
                      <div>
                        <p className="font-extrabold text-link">{formatOrderCode(order.orderCode)}</p>
                        <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                        {order.paymentMethod ? (
                          <p className="text-xs text-muted">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatRupiah(order.total)}</p>
                        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Pagination
            basePath="/orders"
            params={{}}
            page={list.page}
            pageSize={MY_ORDERS_PAGE_SIZE}
            total={list.total}
          />
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Lacak dengan kode pesanan</h2>
        <TrackLookupForm />
      </section>

      {!list ? (
        <p className="text-sm text-muted">
          Punya akun?{' '}
          <Link href="/login?next=/orders" className="font-semibold text-link underline">
            Masuk
          </Link>{' '}
          untuk melihat semua pesananmu di satu tempat.
        </p>
      ) : null}
    </main>
  );
}