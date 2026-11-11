import { UUID_REGEX, parseIntegerString, readText, type ParseResult } from '@/lib/admin/validation';

function fail<T>(error: string): ParseResult<T> {
  return { ok: false, error };
}

// ---------- Kategori ----------

export interface CategoryInput {
  id: string | null;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export function parseCategoryForm(formData: FormData): ParseResult<CategoryInput> {
  const rawId = readText(formData, 'id');
  if (rawId !== '' && !UUID_REGEX.test(rawId)) return fail('ID kategori tidak valid.');

  const name = readText(formData, 'name');
  if (name.length < 1 || name.length > 60) {
    return fail('Nama kategori wajib diisi (maksimal 60 karakter).');
  }

  const rawSort = readText(formData, 'sort_order');
  const sortOrder = rawSort === '' ? 0 : parseIntegerString(rawSort, -1000, 1000);
  if (sortOrder === null) return fail('Urutan harus bilangan bulat antara -1000 dan 1000.');

  return {
    ok: true,
    value: {
      id: rawId === '' ? null : rawId,
      name,
      sortOrder,
      isActive: formData.get('is_active') === 'on',
    },
  };
}

// ---------- Asumsi biaya usaha ----------

export interface BusinessSettingsInput {
  laborRatePerHour: number;
  deliveryCostSchool: number;
  deliveryCostOutside: number;
}

const MAX_COST = 1_000_000;

export function parseBusinessSettingsForm(formData: FormData): ParseResult<BusinessSettingsInput> {
  const labor = parseIntegerString(readText(formData, 'labor_rate_per_hour'), 0, MAX_COST);
  const school = parseIntegerString(readText(formData, 'delivery_cost_school'), 0, MAX_COST);
  const outside = parseIntegerString(readText(formData, 'delivery_cost_outside'), 0, MAX_COST);

  if (labor === null || school === null || outside === null) {
    return fail(`Semua angka harus bilangan bulat Rupiah antara 0 dan ${MAX_COST}.`);
  }

  return {
    ok: true,
    value: { laborRatePerHour: labor, deliveryCostSchool: school, deliveryCostOutside: outside },
  };
}