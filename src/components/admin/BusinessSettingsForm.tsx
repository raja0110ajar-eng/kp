'use client';

import { useActionState, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cardClass, inputClass, labelClass, primaryButtonClass } from '@/components/admin/styles';
import { INITIAL_FORM_STATE } from '@/lib/admin/action-result';
import { saveBusinessSettingsAction } from '@/lib/admin/actions/business-settings';
import type { BusinessSettings } from '@/lib/admin/reports';

export function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const [state, formAction, pending] = useActionState(saveBusinessSettingsAction, INITIAL_FORM_STATE);
  const [labor, setLabor] = useState(String(settings.laborRatePerHour));
  const [school, setSchool] = useState(String(settings.deliveryCostSchool));
  const [outside, setOutside] = useState(String(settings.deliveryCostOutside));

  return (
    <form action={formAction} className={`${cardClass} space-y-4`}>
      <div>
        <h2 className="text-lg font-bold">Asumsi biaya</h2>
        <p className="text-sm text-muted">
          Dipakai menghitung HPP (tenaga) dan laba setelah ongkir. Tenaga dihitung sebagai biaya peluang
          walau anggota tidak digaji, supaya margin tidak terlihat lebih besar dari kenyataan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Tarif tenaga per jam (Rp)
          <input
            type="number"
            name="labor_rate_per_hour"
            min={0}
            step={1}
            inputMode="numeric"
            required
            value={labor}
            onChange={(event) => setLabor(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Biaya antar per pesanan, sekolah (Rp)
          <input
            type="number"
            name="delivery_cost_school"
            min={0}
            step={1}
            inputMode="numeric"
            required
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Biaya antar per pesanan, luar sekolah (Rp)
          <input
            type="number"
            name="delivery_cost_outside"
            min={0}
            step={1}
            inputMode="numeric"
            required
            value={outside}
            onChange={(event) => setOutside(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {state.status !== 'idle' ? (
        <p
          className={`text-sm ${state.status === 'success' ? 'text-success-ink' : 'text-danger-ink'}`}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Simpan asumsi
      </button>
    </form>
  );
}