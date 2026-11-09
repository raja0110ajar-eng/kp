import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { OrderStatusActions } from '@/components/admin/OrderStatusActions';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { cardClass, secondaryButtonClass } from '@/components/admin/styles';
import { getAdminOrderDetail } from '@/lib/admin/queries';
import {
  AI_STATUS_META,
  DELIVERY_AREA_LABEL,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABEL,
  VERIFICATION_META,
} from '@/lib/admin/labels';
import { UUID_REGEX } from '@/lib/admin/validation';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { toWhatsAppUrl } from '@/lib/phone';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  if (!UUID_REGEX.test(orderId)) notFound();

  const order = await getAdminOrderDetail(orderId);
  if (!order) notFound();

  const statusMeta = ORDER_STATUS_META[order.status];
  const whatsappUrl = toWhatsAppUrl(order.customerPhone);
  const payment = order.payment;

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-[#0066FF]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali ke daftar pesanan
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{order.orderCode}</h1>
          <p className="text-sm text-neutral-600">Dibuat {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
      </header>

      <section className={`${cardClass} space-y-3`}>
        <h2 className="text-lg font-bold">Ubah status</h2>
        <OrderStatusActions orderId={order.id} status={order.status} />
      </section>

      <section className={`${cardClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Pembeli dan pengiriman</h2>
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
              <MessageCircle className="h-4 w-4" aria-hidden />
              Hubungi via WhatsApp
            </a>
          ) : null}
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-neutral-500">Nama</dt>
            <dd className="font-semibold">{order.customerName}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Nomor HP</dt>
            <dd className="font-semibold">{order.customerPhone}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Area</dt>
            <dd className="font-semibold">
              {DELIVERY_AREA_LABEL[order.deliveryArea]}
              {order.shippingZoneName ? ` · ${order.shippingZoneName}` : ''}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-neutral-500">Alamat atau lokasi pengantaran</dt>
            <dd className="whitespace-pre-line font-semibold">{order.deliveryAddress}</dd>
          </div>
          {order.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-neutral-500">Catatan pembeli</dt>
              <dd className="whitespace-pre-line">{order.notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className={`${cardClass} space-y-3`}>
        <h2 className="text-lg font-bold">Item pesanan</h2>
        <ul className="divide-y divide-neutral-100 text-sm">
          {order.items.map((item) => (
            <li key={`${item.productName}-${item.unitPrice}`} className="flex justify-between gap-3 py-2">
              <span>
                {item.productName} × {item.quantity}
                <span className="block text-xs text-neutral-500">{formatRupiah(item.unitPrice)} / item</span>
              </span>
              <span className="font-semibold">{formatRupiah(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatRupiah(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Ongkir</dt>
            <dd>{order.shippingFee === 0 ? 'Gratis' : formatRupiah(order.shippingFee)}</dd>
          </div>
          <div className="flex justify-between text-base font-extrabold">
            <dt>Total</dt>
            <dd>{formatRupiah(order.total)}</dd>
          </div>
        </dl>
      </section>

      {payment ? (
        <section className={`${cardClass} space-y-3`}>
          <h2 className="text-lg font-bold">Pembayaran</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{PAYMENT_METHOD_LABEL[payment.method]}</span>
            <StatusBadge tone={VERIFICATION_META[payment.verificationStatus].tone}>
              {VERIFICATION_META[payment.verificationStatus].label}
            </StatusBadge>
            <StatusBadge tone={AI_STATUS_META[payment.aiStatus].tone}>
              {AI_STATUS_META[payment.aiStatus].label}
            </StatusBadge>
          </div>
          {payment.verifiedAt ? (
            <p className="text-xs text-neutral-500">Diproses admin pada {formatDateTime(payment.verifiedAt)}</p>
          ) : null}
          {payment.adminNote ? (
            <p className="rounded-lg bg-neutral-50 p-3 text-sm">Catatan admin: {payment.adminNote}</p>
          ) : null}
          {payment.verificationStatus === 'awaiting_review' ? (
            <Link href="/admin/payments" className="inline-block text-sm font-semibold text-[#0066FF] underline">
              Buka di antrean verifikasi
            </Link>
          ) : null}
          {payment.proofUrl ? (
            <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer" className="block w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.proofUrl}
                alt={`Bukti transfer pesanan ${order.orderCode}`}
                loading="lazy"
                className="max-h-72 w-auto rounded-lg border border-neutral-200"
              />
            </a>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}