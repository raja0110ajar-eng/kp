import { createClient } from '@/lib/supabase/client';
import { PUBLIC_ASSETS_BUCKET } from '@/lib/assets';
import type { PreparedAsset } from '@/lib/admin/prepare-asset-image';

export type AssetFolder = 'products' | 'qris';

/** Mengunggah ke bucket public-assets (hanya admin yang lolos policy) dan mengembalikan path-nya. */
export async function uploadPublicAsset(folder: AssetFolder, prepared: PreparedAsset): Promise<string> {
  const path = `${folder}/${crypto.randomUUID()}.${prepared.extension}`;
  const supabase = createClient();

  const { error } = await supabase.storage.from(PUBLIC_ASSETS_BUCKET).upload(path, prepared.blob, {
    contentType: prepared.contentType,
    upsert: false,
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);

  return path;
}