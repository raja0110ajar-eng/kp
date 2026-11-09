import { supabaseEnv } from '@/lib/supabase/env';

export const PUBLIC_ASSETS_BUCKET = 'public-assets';

/** Mengubah path di bucket public-assets menjadi URL publik Supabase Storage. */
export function getPublicAssetUrl(path: string): string {
  const base = supabaseEnv.url.replace(/\/+$/, '');
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${PUBLIC_ASSETS_BUCKET}/${encodedPath}`;
}