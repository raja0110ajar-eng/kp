import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
import { GuestOrderTracker } from '@/components/orders/GuestOrderTracker';
import { OrderStatusView } from '@/components/orders/OrderStatusView';
import { ReviewSection } from '@/components/orders/ReviewSection';
import { ORDER_CODE_REGEX, normalizeOrderCode } from '@/lib/orders/order-code';
import { getCurrentUserId, getMyOrderByCode } from '@/lib/orders/my-orders';

export const metadata: Metadata = {
  title: 'Lacak pesanan | Karsa Pandiga',
  robots: { index: false, follow: false },
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode: rawCode } = await params;
  const orderCode = normalizeOrderCode(rawCode);
  if (!ORDER_CODE_REGEX.test(orderCode)) notFound();

  // Pembeli yang login dan pemilik pesanan: dibaca lewat RLS tanpa nomor HP.
  // Selain itu (guest, atau pesanan guest): lewat kode + nomor HP di sisi browser.
  const userId = await getCurrentUserId();
  const owned = userId ? await getMyOrderByCode(userId, orderCode) : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-link"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Semua pesanan
      </Link>

      {owned ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <AutoRefresh />
          </div>
          <OrderStatusView order={owned} />
          {owned.status === 'completed' ? (
            <ReviewSection orderCode={owned.order_code} phone="" />
          ) : null}
        </div>
      ) : (
        <GuestOrderTracker orderCode={orderCode} />
      )}
    </main>
  );
}