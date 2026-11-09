'use client';

import { useActionState, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/components/admin/styles';
import { INITIAL_FORM_STATE, type FormState } from '@/lib/admin/action-result';
import { saveZoneAction } from '@/lib/admin/actions/shipping';
import type { AdminShippingZone } from '@/lib/admin/types';

/** zone = null berarti form untuk membuat zona baru. */
export function ZoneForm({ zone }: { zone: AdminShippingZone | null }) {
  const [name, setName] = useState(zone?.name ?? '');
  const [fee, setFee] = useState(zone ? String(zone.fee) : '');
  const [sortOrder, setSortOrder] = useState(zone ? String(zone.sortOrder) : '0');
  const [isActive, setIsActive] = useState(zone?.isActive ?? true);

  // Pada mode buat baru, kosongkan form setelah sukses supaya tidak tersimpan dua kali.
  async function handleSave(previous: FormState, formData: FormData): Promise<FormState> {
    const result = await saveZoneAction(previous, formData);
    if (result.status === 'success' && zone === null) {
      setName('');
      setFee('');
      setSortOrder('0');
      setIsActive(true);
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(handleSave, INITIAL_FORM_STATE);

  return (
    <form action={formAction} className={`${cardClass} space-y-4`}>
      {zone ? <input type="hidden" name="id" value={zone.id} /> : null}
      <h2 className="text-base font-bold">{zone ? zone.name : 'Tambah zona baru'}</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={`${labelClass} sm:col-span-1`}>
          Nama zona
          <input
            type="text"
            name="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Tarif (Rp)
          <input
            type="number"
            name="fee"
            required
            min={0}
            step={1}
            inputMode="numeric"
            value={fee}
            onChange={(event) => setFee(event.target.value)}
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

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Aktif (tampil di checkout)
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
        {zone ? 'Simpan zona' : 'Tambah zona'}
      </button>
    </form>
  );
}