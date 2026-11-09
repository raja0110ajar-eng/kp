'use client';

import { useActionState, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/components/admin/styles';
import { INITIAL_FORM_STATE } from '@/lib/admin/action-result';
import { savePaymentSettingAction } from '@/lib/admin/actions/payment-settings';
import type { AdminPaymentSetting } from '@/lib/admin/types';
import type { OnlinePaymentMethod } from '@/types/catalog';

interface PaymentSettingFormProps {
  method: OnlinePaymentMethod;
  /** null jika baris metode ini belum ada di database. */
  initial: AdminPaymentSetting | null;
  defaultDisplayName: string;
  defaultSortOrder: number;
}

export function PaymentSettingForm({
  method,
  initial,
  defaultDisplayName,
  defaultSortOrder,
}: PaymentSettingFormProps) {
  const [state, formAction, pending] = useActionState(savePaymentSettingAction, INITIAL_FORM_STATE);

  const [displayName, setDisplayName] = useState(initial?.displayName ?? defaultDisplayName);
  const [accountName, setAccountName] = useState(initial?.accountName ?? '');
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? defaultSortOrder));
  const [isActive, setIsActive] = useState(initial?.isActive ?? false);

  return (
    <form action={formAction} className={`${cardClass} space-y-4`}>
      <input type="hidden" name="method" value={method} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{defaultDisplayName}</h2>
        <StatusBadge tone={initial?.isActive ? 'green' : 'neutral'}>
          {initial?.isActive ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Nama tampilan
          <input
            type="text"
            name="display_name"
            required
            maxLength={60}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Urutan tampil
          <input
            type="number"
            name="sort_order"
            step={1}
            inputMode="numeric"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {method === 'qris' ? (
        <ImageUploadField
          name="qris_image_path"
          label="Gambar QRIS"
          folder="qris"
          initialPath={initial?.qrisImagePath ?? null}
          maxSidePx={2000}
          keepOriginalIfFits
          allowRemove={false}
          hint="Gambar asli dipakai apa adanya bila di bawah 2 MB agar tetap terbaca scanner."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Nama penerima
            <input
              type="text"
              name="account_name"
              maxLength={100}
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Nomor rekening / akun
            <input
              type="text"
              name="account_number"
              maxLength={60}
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      )}

      <label className={labelClass}>
        Petunjuk untuk pembeli
        <textarea
          name="instructions"
          rows={2}
          maxLength={500}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Aktif (tampil sebagai pilihan di checkout)
      </label>

      {state.status !== 'idle' ? (
        <p
          className={`text-sm ${state.status === 'success' ? 'text-emerald-700' : 'text-[#FF6B00]'}`}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Simpan
      </button>
    </form>
  );
}