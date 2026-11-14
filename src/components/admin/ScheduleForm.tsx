'use client';

import { useActionState, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '@/components/admin/styles';
import { INITIAL_FORM_STATE } from '@/lib/admin/action-result';
import { updateScheduleAction } from '@/lib/admin/actions/orders';
import type { OrderSchedule } from '@/lib/admin/schedule-queries';
import { formatDateTime } from '@/lib/format';
import { formatOrderCode } from '@/lib/orders/order-code';
import { formatEtaDate } from '@/lib/orders/schedule';
import { getSiteUrl } from '@/lib/site-url';
import { buildWhatsAppLink } from '@/lib/whatsapp';

interface ScheduleFormProps {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  schedule: OrderSchedule;
}

const TIME_CHIPS = ['Jam istirahat pertama', 'Jam istirahat kedua', 'Sepulang sekolah'] as const;
const NOTE_CHIPS = [
  'Pengerjaan butuh waktu lebih lama dari perkiraan.',
  'Bahan masih menunggu, jadwal mundur.',
  'Selesai lebih cepat dari perkiraan.',
] as const;

export function ScheduleForm({
  orderId,
  orderCode,
  customerName,
  customerPhone,
  schedule,
}: ScheduleFormProps) {
  const [state, formAction, pending] = useActionState(updateScheduleAction, INITIAL_FORM_STATE);
  const [etaDate, setEtaDate] = useState(schedule.etaDate ?? '');
  const [etaNote, setEtaNote] = useState(schedule.etaNote ?? '');
  const [customerNote, setCustomerNote] = useState(schedule.customerNote ?? '');

  const firstName = customerName.trim().split(/\s+/)[0] ?? customerName;
  const parts = [`Halo ${firstName}, kabar pesananmu ${formatOrderCode(orderCode)} dari Karsa Pandiga.`];
  if (etaDate !== '') {
    parts.push(
      `Perkiraan diantar ${formatEtaDate(etaDate)}${etaNote.trim() !== '' ? ` (${etaNote.trim()})` : ''}.`
    );
  }
  if (customerNote.trim() !== '') parts.push(customerNote.trim());
  parts.push(`Pantau di ${getSiteUrl()}/orders/${orderCode}`);
  const whatsappUrl = buildWhatsAppLink(customerPhone, parts.join(' '));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="order_id" value={orderId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Perkiraan tanggal diantar
          <input
            type="date"
            name="eta_date"
            value={etaDate}
            onChange={(event) => setEtaDate(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Keterangan waktu (opsional)
          <input
            type="text"
            name="eta_note"
            maxLength={200}
            value={etaNote}
            onChange={(event) => setEtaNote(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {TIME_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setEtaNote(chip)}
            className="rounded-full border border-line-strong px-3 py-1 text-xs font-semibold transition hover:bg-soft"
          >
            {chip}
          </button>
        ))}
      </div>

      <label className={labelClass}>
        Catatan untuk pembeli (opsional)
        <textarea
          name="customer_note"
          rows={2}
          maxLength={300}
          value={customerNote}
          onChange={(event) => setCustomerNote(event.target.value)}
          className={inputClass}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {NOTE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setCustomerNote(chip)}
            className="rounded-full border border-line-strong px-3 py-1 text-xs font-semibold transition hover:bg-soft"
          >
            {chip}
          </button>
        ))}
      </div>

      {schedule.scheduleUpdatedAt ? (
        <p className="text-xs text-muted">
          Terakhir diubah admin: {formatDateTime(schedule.scheduleUpdatedAt)}.
        </p>
      ) : (
        <p className="text-xs text-muted">
          Tanggal di atas masih perkiraan otomatis dari estimasi pengerjaan produk.
        </p>
      )}

      {state.status !== 'idle' ? (
        <p
          className={`text-sm ${state.status === 'success' ? 'text-success-ink' : 'text-danger-ink'}`}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Simpan jadwal
        </button>
        {whatsappUrl !== '' ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
            <MessageCircle className="h-4 w-4" aria-hidden />
            Kabari via WhatsApp
          </a>
        ) : null}
      </div>
      <p className="text-xs text-muted">
        Simpan dulu, lalu kirim kabar. Pesan WhatsApp memakai isi yang sedang tampil di form ini.
      </p>
    </form>
  );
}