'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/admin/styles';
import { INITIAL_FORM_STATE } from '@/lib/admin/action-result';
import { saveProductAction } from '@/lib/admin/actions/products';
import { computeUnitCost } from '@/lib/admin/costing';
import type { AdminCategory, AdminProduct } from '@/lib/admin/types';
import { formatRupiah } from '@/lib/format';
import { slugify } from '@/lib/slugify';
import type { ProductType } from '@/types/domain';

interface ProductFormProps {
  product: AdminProduct | null;
  categories: AdminCategory[];
  laborRatePerHour: number;
}

function toInt(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

export function ProductForm({ product, categories, laborRatePerHour }: ProductFormProps) {
  const isEdit = product !== null;
  const [state, formAction, pending] = useActionState(saveProductAction, INITIAL_FORM_STATE);

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [leadTime, setLeadTime] = useState(product ? String(product.leadTimeDays) : '0');
  const [productType, setProductType] = useState<ProductType>(product?.productType ?? 'own_product');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [materials, setMaterials] = useState(product?.materials ?? '');
  const [dimensions, setDimensions] = useState(product?.dimensions ?? '');
  const [weight, setWeight] = useState(product?.weightGrams ? String(product.weightGrams) : '');
  const [resellerName, setResellerName] = useState(product?.resellerName ?? '');
  const [costPrice, setCostPrice] = useState(
    product?.costPrice !== null && product?.costPrice !== undefined ? String(product.costPrice) : ''
  );
  const [packaging, setPackaging] = useState(product ? String(product.packagingCost) : '0');
  const [minutes, setMinutes] = useState(product ? String(product.laborMinutes) : '0');

  const unitCost = computeUnitCost(
    {
      costPrice: toInt(costPrice),
      packagingCost: toInt(packaging) ?? 0,
      laborMinutes: toInt(minutes) ?? 0,
    },
    laborRatePerHour
  );
  const priceValue = toInt(price);
  const margin = unitCost !== null && priceValue !== null ? priceValue - unitCost : null;
  const marginPercent =
    margin !== null && priceValue !== null && priceValue > 0 ? (margin / priceValue) * 100 : null;

  return (
    <form action={formAction} className="space-y-6">
      {isEdit ? <input type="hidden" name="id" value={product.id} /> : null}

      <label className={labelClass}>
        Nama produk
        <input
          type="text"
          name="name"
          required
          maxLength={120}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!isEdit && !slugTouched) setSlug(slugify(event.target.value));
          }}
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Slug (bagian URL)
        <input
          type="text"
          name="slug"
          required={!isEdit}
          readOnly={isEdit}
          maxLength={80}
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugTouched(true);
          }}
          className={`${inputClass} ${isEdit ? 'bg-soft text-muted' : ''}`}
        />
        <span className="mt-1 block text-xs font-normal text-muted">
          {isEdit
            ? 'Slug terkunci setelah produk dibuat agar tautan lama tidak putus.'
            : 'Dibuat otomatis dari nama. Huruf kecil, angka, dan tanda hubung.'}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Kategori
          <select
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={inputClass}
          >
            <option value="">Tanpa kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Tipe produk
          <select
            name="product_type"
            value={productType}
            onChange={(event) =>
              setProductType(event.target.value === 'reseller' ? 'reseller' : 'own_product')
            }
            className={inputClass}
          >
            <option value="own_product">Karya Kami</option>
            <option value="reseller">Reseller</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Harga jual (Rp)
          <input
            type="number"
            name="price"
            required
            min={0}
            step={1}
            inputMode="numeric"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Stok
          <input
            type="number"
            name="stock"
            required
            min={0}
            step={1}
            inputMode="numeric"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Estimasi pengerjaan (hari)
          <input
            type="number"
            name="lead_time_days"
            min={0}
            max={60}
            step={1}
            inputMode="numeric"
            value={leadTime}
            onChange={(event) => setLeadTime(event.target.value)}
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-muted">0 berarti siap dikirim.</span>
        </label>
      </div>

      <label className={labelClass}>
        Deskripsi
        <textarea
          name="description"
          rows={4}
          maxLength={1000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
        />
        <span className="mt-1 block text-xs font-normal text-muted">
          Tulis 2 sampai 3 kalimat: apa produknya, untuk siapa, dan cara pakai atau merawatnya.
        </span>
      </label>

      <fieldset className="grid gap-4 rounded-xl bg-soft p-4 sm:grid-cols-3">
        <legend className="px-1 text-xs font-semibold text-muted">Detail produk</legend>
        <label className={labelClass}>
          Bahan
          <input
            type="text"
            name="materials"
            maxLength={200}
            value={materials}
            onChange={(event) => setMaterials(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Ukuran
          <input
            type="text"
            name="dimensions"
            maxLength={100}
            value={dimensions}
            onChange={(event) => setDimensions(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Berat (gram)
          <input
            type="number"
            name="weight_grams"
            min={1}
            step={1}
            inputMode="numeric"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            className={inputClass}
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl bg-soft p-4">
        <legend className="px-1 text-xs font-semibold text-muted">
          Biaya produksi per unit (internal, tidak tampil ke pembeli)
        </legend>

        {productType === 'reseller' ? (
          <label className={labelClass}>
            Nama reseller
            <input
              type="text"
              name="reseller_name"
              maxLength={120}
              value={resellerName}
              onChange={(event) => setResellerName(event.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            {productType === 'reseller' ? 'Harga beli (Rp)' : 'Biaya bahan (Rp)'}
            <input
              type="number"
              name="cost_price"
              min={0}
              step={1}
              inputMode="numeric"
              value={costPrice}
              onChange={(event) => setCostPrice(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Biaya kemasan (Rp)
            <input
              type="number"
              name="packaging_cost"
              min={0}
              step={1}
              inputMode="numeric"
              value={packaging}
              onChange={(event) => setPackaging(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Menit pengerjaan
            <input
              type="number"
              name="labor_minutes"
              min={0}
              max={6000}
              step={1}
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <p className="text-sm text-ink-soft" aria-live="polite">
          {unitCost === null ? (
            'Isi biaya bahan untuk melihat HPP dan margin.'
          ) : (
            <>
              HPP per unit <strong>{formatRupiah(unitCost)}</strong> (tarif tenaga{' '}
              {formatRupiah(laborRatePerHour)} per jam).
              {margin !== null ? (
                <>
                  {' '}
                  Margin <strong>{formatRupiah(margin)}</strong>
                  {marginPercent !== null
                    ? ` (${marginPercent.toFixed(1).replace('.', ',')}%)`
                    : ''}
                  .
                </>
              ) : null}
            </>
          )}
        </p>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploadField
          name="image_path"
          label="Foto utama"
          folder="products"
          initialPath={product?.imagePath ?? null}
          maxSidePx={1200}
          keepOriginalIfFits={false}
          allowRemove
          hint="Persegi (1:1) paling rapi. Otomatis dikecilkan dan dikompres."
        />
        {[0, 1, 2].map((index) => (
          <ImageUploadField
            key={index}
            name={`gallery_${index + 1}`}
            label={`Foto tambahan ${index + 1}`}
            folder="products"
            initialPath={product?.galleryPaths[index] ?? null}
            maxSidePx={1200}
            keepOriginalIfFits={false}
            allowRemove
          />
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Tampilkan di katalog (aktif)
      </label>

      {state.status === 'error' ? (
        <p className="text-sm text-danger-ink" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isEdit ? 'Simpan perubahan' : 'Buat produk'}
        </button>
        <Link href="/admin/products" className={secondaryButtonClass}>
          Batal
        </Link>
      </div>
    </form>
  );
}