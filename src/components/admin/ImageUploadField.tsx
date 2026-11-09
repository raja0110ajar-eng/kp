'use client';

import { useState, type ChangeEvent } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { getPublicAssetUrl } from '@/lib/assets';
import { getAssetImageErrorMessage, prepareAssetImage } from '@/lib/admin/prepare-asset-image';
import { uploadPublicAsset, type AssetFolder } from '@/lib/admin/upload-asset';
import { secondaryButtonClass } from '@/components/admin/styles';

interface ImageUploadFieldProps {
  /** Nama field tersembunyi yang dikirim bersama form (berisi path di bucket). */
  name: string;
  label: string;
  folder: AssetFolder;
  initialPath: string | null;
  maxSidePx: number;
  keepOriginalIfFits: boolean;
  allowRemove: boolean;
  hint?: string;
}

export function ImageUploadField({
  name,
  label,
  folder,
  initialPath,
  maxSidePx,
  keepOriginalIfFits,
  allowRemove,
  hint,
}: ImageUploadFieldProps) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const prepared = await prepareAssetImage(file, { maxSidePx, keepOriginalIfFits });
      setPath(await uploadPublicAsset(folder, prepared));
    } catch (uploadError) {
      setError(getAssetImageErrorMessage(uploadError));
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={path ?? ''} />

      {path ? (
        <div className="w-40 overflow-hidden rounded-lg border border-line bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getPublicAssetUrl(path)} alt={label} className="h-auto w-full" />
        </div>
      ) : (
        <p className="text-sm text-muted">Belum ada gambar.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className={`${secondaryButtonClass} cursor-pointer`}>
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden />
          )}
          {path ? 'Ganti gambar' : 'Pilih gambar'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={handleChange}
          />
        </label>
        {allowRemove && path ? (
          <button type="button" onClick={() => setPath(null)} className={secondaryButtonClass}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Hapus gambar
          </button>
        ) : null}
      </div>

      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-sm text-accent-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}