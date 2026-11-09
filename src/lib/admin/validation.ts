import type { OnlinePaymentMethod } from '@/types/catalog';
import type { ProductType } from '@/types/domain';

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const PRODUCT_IMAGE_PATH_REGEX = /^products\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const QRIS_IMAGE_PATH_REGEX = /^qris\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const ONLINE_METHODS: readonly OnlinePaymentMethod[] = [
  'qris',
  'dana',
  'ovo',
  'gopay',
  'bank_transfer',
];

const MAX_PRICE = 100_000_000;
const MAX_STOCK = 100_000;
const MAX_FEE = 1_000_000;

function fail<T>(error: string): ParseResult<T> {
  return { ok: false, error };
}

export function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export function parseIntegerString(raw: string, min: number, max: number): number | null {
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
}

function readId(formData: FormData): ParseResult<string | null> {
  const raw = readText(formData, 'id');
  if (raw === '') return { ok: true, value: null };
  if (!UUID_REGEX.test(raw)) return fail('ID tidak valid.');
  return { ok: true, value: raw };
}

// ---------- Produk ----------

export interface ProductInput {
  id: string | null;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  productType: ProductType;
  isActive: boolean;
  imagePath: string | null;
  resellerName: string | null;
  costPrice: number | null;
}

export function parseProductForm(formData: FormData): ParseResult<ProductInput> {
  const idResult = readId(formData);
  if (!idResult.ok) return fail(idResult.error);
  const id = idResult.value;

  const name = readText(formData, 'name');
  if (name.length < 1 || name.length > 120) {
    return fail('Nama produk wajib diisi (maksimal 120 karakter).');
  }

  // Slug hanya dipakai saat membuat produk. Saat edit, slug terkunci dan diabaikan.
  const slug = readText(formData, 'slug');
  if (id === null && (slug.length < 1 || slug.length > 80 || !SLUG_REGEX.test(slug))) {
    return fail('Slug hanya boleh huruf kecil, angka, dan tanda hubung (maksimal 80 karakter).');
  }

  const description = readText(formData, 'description');
  if (description.length > 1000) return fail('Deskripsi maksimal 1000 karakter.');

  const price = parseIntegerString(readText(formData, 'price'), 0, MAX_PRICE);
  if (price === null) return fail(`Harga harus bilangan bulat Rupiah antara 0 dan ${MAX_PRICE}.`);

  const stock = parseIntegerString(readText(formData, 'stock'), 0, MAX_STOCK);
  if (stock === null) return fail(`Stok harus bilangan bulat antara 0 dan ${MAX_STOCK}.`);

  const rawType = readText(formData, 'product_type');
  if (rawType !== 'own_product' && rawType !== 'reseller') return fail('Tipe produk tidak valid.');
  const productType: ProductType = rawType;

  const rawImage = readText(formData, 'image_path');
  if (rawImage !== '' && !PRODUCT_IMAGE_PATH_REGEX.test(rawImage)) {
    return fail('Path gambar tidak valid. Unggah ulang gambarnya.');
  }

  let resellerName: string | null = null;
  let costPrice: number | null = null;
  if (productType === 'reseller') {
    const rawReseller = readText(formData, 'reseller_name');
    if (rawReseller.length > 120) return fail('Nama reseller maksimal 120 karakter.');
    resellerName = rawReseller === '' ? null : rawReseller;

    const rawCost = readText(formData, 'cost_price');
    if (rawCost !== '') {
      const parsedCost = parseIntegerString(rawCost, 0, MAX_PRICE);
      if (parsedCost === null) return fail('Harga modal harus bilangan bulat Rupiah.');
      costPrice = parsedCost;
    }
  }

  return {
    ok: true,
    value: {
      id,
      slug,
      name,
      description,
      price,
      stock,
      productType,
      isActive: formData.get('is_active') === 'on',
      imagePath: rawImage === '' ? null : rawImage,
      resellerName,
      costPrice,
    },
  };
}

// ---------- Zona tarif ----------

export interface ZoneInput {
  id: string | null;
  name: string;
  fee: number;
  sortOrder: number;
  isActive: boolean;
}

export function parseZoneForm(formData: FormData): ParseResult<ZoneInput> {
  const idResult = readId(formData);
  if (!idResult.ok) return fail(idResult.error);

  const name = readText(formData, 'name');
  if (name.length < 1 || name.length > 80) {
    return fail('Nama zona wajib diisi (maksimal 80 karakter).');
  }

  const fee = parseIntegerString(readText(formData, 'fee'), 0, MAX_FEE);
  if (fee === null) return fail(`Tarif harus bilangan bulat Rupiah antara 0 dan ${MAX_FEE}.`);

  const rawSort = readText(formData, 'sort_order');
  const sortOrder = rawSort === '' ? 0 : parseIntegerString(rawSort, -1000, 1000);
  if (sortOrder === null) return fail('Urutan harus bilangan bulat antara -1000 dan 1000.');

  return {
    ok: true,
    value: { id: idResult.value, name, fee, sortOrder, isActive: formData.get('is_active') === 'on' },
  };
}

// ---------- Setelan pembayaran ----------

export interface PaymentSettingInput {
  method: OnlinePaymentMethod;
  displayName: string;
  accountName: string | null;
  accountNumber: string | null;
  instructions: string;
  qrisImagePath: string | null;
  sortOrder: number;
  isActive: boolean;
}

export function parsePaymentSettingForm(formData: FormData): ParseResult<PaymentSettingInput> {
  const rawMethod = readText(formData, 'method');
  const method = ONLINE_METHODS.find((candidate) => candidate === rawMethod);
  if (!method) return fail('Metode pembayaran tidak valid.');

  const displayName = readText(formData, 'display_name');
  if (displayName.length < 1 || displayName.length > 60) {
    return fail('Nama tampilan wajib diisi (maksimal 60 karakter).');
  }

  const instructions = readText(formData, 'instructions');
  if (instructions.length > 500) return fail('Petunjuk maksimal 500 karakter.');

  const rawSort = readText(formData, 'sort_order');
  const sortOrder = rawSort === '' ? 0 : parseIntegerString(rawSort, -1000, 1000);
  if (sortOrder === null) return fail('Urutan harus bilangan bulat antara -1000 dan 1000.');

  let accountName: string | null = null;
  let accountNumber: string | null = null;
  let qrisImagePath: string | null = null;

  if (method === 'qris') {
    const rawPath = readText(formData, 'qris_image_path');
    if (rawPath !== '' && !QRIS_IMAGE_PATH_REGEX.test(rawPath)) {
      return fail('Path gambar QRIS tidak valid. Unggah ulang gambarnya.');
    }
    qrisImagePath = rawPath === '' ? null : rawPath;
  } else {
    const rawName = readText(formData, 'account_name');
    const rawNumber = readText(formData, 'account_number');
    if (rawName.length > 100) return fail('Nama penerima maksimal 100 karakter.');
    if (rawNumber.length > 60) return fail('Nomor rekening/akun maksimal 60 karakter.');
    accountName = rawName === '' ? null : rawName;
    accountNumber = rawNumber === '' ? null : rawNumber;
  }

  return {
    ok: true,
    value: {
      method,
      displayName,
      accountName,
      accountNumber,
      instructions,
      qrisImagePath,
      sortOrder,
      isActive: formData.get('is_active') === 'on',
    },
  };
}