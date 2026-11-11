import type { ProductType } from '@/types/domain';
import {
  PRODUCT_IMAGE_PATH_REGEX,
  SLUG_REGEX,
  UUID_REGEX,
  parseIntegerString,
  readText,
  type ParseResult,
} from '@/lib/admin/validation';

export interface ProductInput {
  id: string | null;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  productType: ProductType;
  categoryId: string | null;
  isActive: boolean;
  imagePath: string | null;
  galleryPaths: string[];
  materials: string | null;
  dimensions: string | null;
  weightGrams: number | null;
  leadTimeDays: number;
  resellerName: string | null;
  costPrice: number | null;
  packagingCost: number;
  laborMinutes: number;
}

const MAX_MONEY = 100_000_000;
const MAX_STOCK = 100_000;

function fail<T>(error: string): ParseResult<T> {
  return { ok: false, error };
}

function optionalText(formData: FormData, key: string, maxLength: number, label: string): ParseResult<string | null> {
  const value = readText(formData, key);
  if (value.length > maxLength) return fail(`${label} maksimal ${maxLength} karakter.`);
  return { ok: true, value: value === '' ? null : value };
}

export function parseProductForm(formData: FormData): ParseResult<ProductInput> {
  const rawId = readText(formData, 'id');
  if (rawId !== '' && !UUID_REGEX.test(rawId)) return fail('ID produk tidak valid.');
  const id = rawId === '' ? null : rawId;

  const name = readText(formData, 'name');
  if (name.length < 1 || name.length > 120) {
    return fail('Nama produk wajib diisi (maksimal 120 karakter).');
  }

  const slug = readText(formData, 'slug');
  if (id === null && (slug.length < 1 || slug.length > 80 || !SLUG_REGEX.test(slug))) {
    return fail('Slug hanya boleh huruf kecil, angka, dan tanda hubung (maksimal 80 karakter).');
  }

  const description = readText(formData, 'description');
  if (description.length > 1000) return fail('Deskripsi maksimal 1000 karakter.');

  const price = parseIntegerString(readText(formData, 'price'), 0, MAX_MONEY);
  if (price === null) return fail(`Harga harus bilangan bulat Rupiah antara 0 dan ${MAX_MONEY}.`);

  const stock = parseIntegerString(readText(formData, 'stock'), 0, MAX_STOCK);
  if (stock === null) return fail(`Stok harus bilangan bulat antara 0 dan ${MAX_STOCK}.`);

  const rawType = readText(formData, 'product_type');
  if (rawType !== 'own_product' && rawType !== 'reseller') return fail('Tipe produk tidak valid.');
  const productType: ProductType = rawType;

  const rawCategory = readText(formData, 'category_id');
  if (rawCategory !== '' && !UUID_REGEX.test(rawCategory)) return fail('Kategori tidak valid.');

  const materials = optionalText(formData, 'materials', 200, 'Bahan');
  if (!materials.ok) return fail(materials.error);
  const dimensions = optionalText(formData, 'dimensions', 100, 'Ukuran');
  if (!dimensions.ok) return fail(dimensions.error);

  const rawWeight = readText(formData, 'weight_grams');
  let weightGrams: number | null = null;
  if (rawWeight !== '') {
    weightGrams = parseIntegerString(rawWeight, 1, 100000);
    if (weightGrams === null) return fail('Berat harus bilangan bulat gram antara 1 dan 100000.');
  }

  const rawLead = readText(formData, 'lead_time_days');
  const leadTimeDays = rawLead === '' ? 0 : parseIntegerString(rawLead, 0, 60);
  if (leadTimeDays === null) return fail('Estimasi pengerjaan harus antara 0 dan 60 hari.');

  const rawImage = readText(formData, 'image_path');
  if (rawImage !== '' && !PRODUCT_IMAGE_PATH_REGEX.test(rawImage)) {
    return fail('Path gambar tidak valid. Unggah ulang gambarnya.');
  }

  const galleryPaths: string[] = [];
  for (const key of ['gallery_1', 'gallery_2', 'gallery_3']) {
    const rawPath = readText(formData, key);
    if (rawPath === '') continue;
    if (!PRODUCT_IMAGE_PATH_REGEX.test(rawPath)) {
      return fail('Path foto tambahan tidak valid. Unggah ulang fotonya.');
    }
    if (rawPath !== rawImage && !galleryPaths.includes(rawPath)) galleryPaths.push(rawPath);
  }

  let resellerName: string | null = null;
  if (productType === 'reseller') {
    const reseller = optionalText(formData, 'reseller_name', 120, 'Nama reseller');
    if (!reseller.ok) return fail(reseller.error);
    resellerName = reseller.value;
  }

  const rawCost = readText(formData, 'cost_price');
  let costPrice: number | null = null;
  if (rawCost !== '') {
    costPrice = parseIntegerString(rawCost, 0, MAX_MONEY);
    if (costPrice === null) return fail('Biaya bahan harus bilangan bulat Rupiah.');
  }

  const rawPackaging = readText(formData, 'packaging_cost');
  const packagingCost = rawPackaging === '' ? 0 : parseIntegerString(rawPackaging, 0, MAX_MONEY);
  if (packagingCost === null) return fail('Biaya kemasan harus bilangan bulat Rupiah.');

  const rawMinutes = readText(formData, 'labor_minutes');
  const laborMinutes = rawMinutes === '' ? 0 : parseIntegerString(rawMinutes, 0, 6000);
  if (laborMinutes === null) return fail('Menit pengerjaan harus antara 0 dan 6000.');

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
      categoryId: rawCategory === '' ? null : rawCategory,
      isActive: formData.get('is_active') === 'on',
      imagePath: rawImage === '' ? null : rawImage,
      galleryPaths,
      materials: materials.value,
      dimensions: dimensions.value,
      weightGrams,
      leadTimeDays,
      resellerName,
      costPrice,
      packagingCost,
      laborMinutes,
    },
  };
}