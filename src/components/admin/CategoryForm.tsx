'use client';

import { useActionState, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cardClass, inputClass, labelClass, primaryButtonClass } from '@/components/admin/styles';
import { INITIAL_FORM_STATE, type FormState } from '@/lib/admin/action-result';
import { saveCategoryAction } from '@/lib/admin/actions/categories';
import type { AdminCategory } from '@/lib/admin/types';

/** category = null berarti form untuk membuat kategori baru. */
export function CategoryForm({ category }: { category: AdminCategory | null }) {
  const [name, setName] = useState(category?.name ?? '');
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : '0');
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  async function handleSave(previous: FormState, formData: FormData): Promise<FormState> {
    const result = await saveCategoryAction(previous, formData);
    if (result.status === 'success' && category === null) {
      setName('');
      setSortOrder('0');
      setIsActive(true);
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(handleSave, INITIAL_FORM_STATE);

  return (
    <form action={formAction} className={`${cardClass} space-y-4`}>
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <h2 className="text-base font-bold">{category ? category.name : 'Tambah kategori baru'}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Nama kategori
          <input
            type="text"
            name="name"
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
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
        Aktif (tampil di katalog)
      </label>

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
        {category ? 'Simpan kategori' : 'Tambah kategori'}
      </button>
    </form>
  );
}