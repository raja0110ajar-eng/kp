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
import type { AdminProduct } from '@/lib/admin/types';
import type { ProductType } from '@/types/domain';

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

export function ProductForm({ product }: { product: AdminProduct | null }) {
  const isEdit = product !== null;
  const [state, formAction, pending] = useActionState(saveProductAction, INITIAL_FORM_STATE);

  // Input terkontrol agar isian tidak hilang ketika validasi server gagal.
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [productType, setProductType] = useState<ProductType>(product?.productType ?? 'own_product');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [resellerName, setResellerName] = useState(product?.resellerName ?? '');
  const [costPrice, setCostPrice] = useState(
    product?.costPrice !== null && product?.costPrice !== undefined ? String(product.costPrice) : ''
  );

  return (
    <form action={formAction} className="space-y-5">
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
          className={`${inputClass} ${isEdit ? 'bg-neutral-100 text-neutral-500' : ''}`}
        />
        <span className="mt-1 block text-xs font-normal text-neutral-500">
          {isEdit
            ? 'Slug terkunci setelah produk dibuat agar tautan lama tidak putus.'
            : 'Dibuat otomatis dari nama. Huruf kecil, angka, dan tanda hubung.'}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
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
        <label className={labelClass}>
          Harga (Rp)
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
      </div>

      {productType === 'reseller' ? (
        <fieldset className="grid gap-4 rounded-xl bg-neutral-50 p-4 sm:grid-cols-2">
          <legend className="px-1 text-xs font-semibold text-neutral-500">
            Data internal reseller (tidak tampil ke pembeli)
          </legend>
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
          <label className={labelClass}>
            Harga modal (Rp)
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
        </fieldset>
      ) : null}

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
      </label>

      <ImageUploadField
        name="image_path"
        label="Gambar produk"
        folder="products"
        initialPath={product?.imagePath ?? null}
        maxSidePx={1200}
        keepOriginalIfFits={false}
        allowRemove
        hint="JPG, PNG, atau WebP. Otomatis dikecilkan dan dikompres sebelum diunggah."
      />

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
        <p className="text-sm text-[#FF6B00]" role="alert">
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