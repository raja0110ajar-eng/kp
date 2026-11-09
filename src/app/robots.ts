import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/login', '/orders', '/cart', '/checkout'],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}