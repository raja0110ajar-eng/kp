import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/products`, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (error) {
      console.error('Sitemap: gagal memuat produk:', error.message);
      return entries;
    }

    const rows = (data ?? []) as unknown as Array<{ slug: string; updated_at: string }>;
    for (const row of rows) {
      entries.push({
        url: `${base}/products/${row.slug}`,
        lastModified: new Date(row.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch (caught) {
    console.error('Sitemap: gagal memuat produk:', caught);
  }

  return entries;
}