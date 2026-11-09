import Link from 'next/link';
import { AlertTriangle, Check, MessageCircle, Upload } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { siteConfig } from '@/config/site';
import { DELIVERY_AREA_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/admin/labels';
import { formatDateTime, formatRupiah } from '@/lib/format';
import {
  BUYER_ORDER_STATUS,
  buildTimeline,
  getPaymentStatusText,
} from '@/lib/orders/labels';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import type { TrackedOrderDetail } from '@/types/tracking';

const cardClass = 'rounded-2xl border border-line bg-surface p-5';

export function OrderStatusView({ order }: { order: TrackedOrderDetail }) {
  const { payment } = order;
  const isCod = payment.method === 'cod';
  const cancelled = order.status === 'cancelled';
  const statusMeta = BUYER_ORDER_STATUS[order.status];

  const steps = buildTimeline(order.status, payment.method);
  const doneCount = steps.filter((step) => step.state === 'done').length;
  const progress = Math.round((doneCount / (steps.length - 1)) * 100);

  const needsProof = !isCod && order.status === 'awaiting_payment';
  const rejected = payment.verification_status === 'rejected';

  const whatsappUrl =
    siteConfig.contact.whatsapp !== ''
      ? buildWhatsAppLink(
          siteConfig.contact.whatsapp,
          `Halo Karsa Pandiga, saya ingin menanyakan pesanan ${order.order_code}.`
        )
      : '';

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Pesanan {order.order_code}</h1>
          <p className="text-sm text-muted">Dibuat {formatDateTime(order.created_at)}</p>
          <p className="text-xs text-muted">Diperbarui {formatDateTime(order.updated_at)}</p>
        </div>
        <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
      </header>

      {cancelled ? (
        <div className="rounded-2xl border border-danger-line bg-danger-soft p-5 text-sm text-danger-ink">
          <p className="font-semibold">Pesanan ini dibatalkan.</p>
          {payment.admin_note ? <p className="mt-1">Catatan admin: {payment.admin_note}</p> : null}
          <p className="mt-1">Hubungi admin bila kamu merasa ini keliru.</p>
        </div>
      ) : (
        <section className={cardClass} aria-label="Tahapan pesanan">
          <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-sunken">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <ol className="grid gap-3 sm:grid-cols-5">
            {steps.map((step, index) => (
              <li
                key={step.key}
                aria-current={step.state === 'current' ? 'step' : undefined}
                className="flex items-center gap-3 sm:flex-col sm:text-center"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step.state === 'done'
                      ? 'bg-primary text-white'
                      : step.state === 'current'
                        ? 'bg-accent text-white'
                        : 'bg-soft text-muted'
                  }`}
                >
                  {step.state === 'done' ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                </span>
                <span
                  className={`text-sm ${
                    step.state === 'upcoming' ? 'text-muted' : 'font-semibold text-ink'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {needsProof ? (
        <div className="space-y-3 rounded-2xl border border-accent bg-accent/5 p-5">
          <p className="flex items-start gap-2 text-sm font-semibold text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
            {rejected
              ? 'Bukti transfermu ditolak admin. Silakan unggah bukti yang baru.'
              : 'Pesananmu belum dibayar. Selesaikan pembayaran dan unggah bukti transfer.'}
          </p>
          {rejected && payment.admin_note ? (
            <p className="text-sm text-ink-soft">Catatan admin: {payment.admin_note}</p>
          ) : null}
          <Link
            href={`/orders/${order.order_code}/pay`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {rejected ? 'Unggah ulang bukti' : 'Lanjutkan pembayaran'}
          </Link>
        </div>
      ) : null}

      <section className={`${cardClass} space-y-3`}>
        <h2 className="text-lg font-bold">Item pesanan</h2>
        <ul className="divide-y divide-line text-sm">
          {order.items.map((item) => (
            <li
              key={`${item.product_name}-${item.unit_price}`}
              className="flex justify-between gap-3 py-2"
            >
              <span>
                {item.product_name} × {item.quantity}
                <span className="block text-xs text-muted">
                  {formatRupiah(item.unit_price)} / item
                </span>
              </span>
              <span className="font-semibold">{formatRupiah(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatRupiah(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Ongkir</dt>
            <dd>{order.shipping_fee === 0 ? 'Gratis' : formatRupiah(order.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between text-base font-extrabold">
            <dt>Total</dt>
            <dd>{formatRupiah(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className={`${cardClass} space-y-3`}>
        <h2 className="text-lg font-bold">Pengiriman</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Area</dt>
            <dd className="font-semibold">
              {DELIVERY_AREA_LABEL[order.delivery_area]}
              {order.shipping_zone_name ? ` · ${order.shipping_zone_name}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Penerima</dt>
            <dd className="font-semibold">{order.customer_name}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Lokasi pengantaran</dt>
            <dd className="whitespace-pre-line font-semibold">{order.delivery_address}</dd>
          </div>
          {order.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Catatanmu</dt>
              <dd className="whitespace-pre-line">{order.notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className={`${cardClass} space-y-2`}>
        <h2 className="text-lg font-bold">Pembayaran</h2>
        <p className="text-sm">
          <span className="font-semibold">{PAYMENT_METHOD_LABEL[payment.method]}</span> ·{' '}
          {getPaymentStatusText(payment.method, payment.verification_status)}
        </p>
      </section>

      {whatsappUrl !== '' ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft p-5">
          <div>
            <p className="text-sm font-semibold">Ada pertanyaan tentang pesanan ini?</p>
            {siteConfig.contact.replyHours !== '' ? (
              <p className="text-xs text-muted">Jam balas: {siteConfig.contact.replyHours}</p>
            ) : null}
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-soft"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Tanya admin via WhatsApp
          </a>
        </section>
      ) : null}
    </div>
  );
}