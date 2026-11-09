/** Alamat dasar situs untuk metadata, sitemap, dan robots. Diisi lewat NEXT_PUBLIC_SITE_URL saat domain final diketahui. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const base = raw && raw.trim() !== '' ? raw.trim() : 'http://localhost:3000';
  return base.replace(/\/+$/, '');
}