import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductGallery, type GalleryImage } from '@/components/catalog/ProductGallery';
import { ProductReviews } from '@/components/catalog/ProductReviews';
import { RatingStars } from '@/components/ui/RatingStars';
import { siteConfig } from '@/config/site';
import { getPublicAssetUrl } from '@/lib/assets';
import { PRODUCT_TYPE_BADGE_CLASS, PRODUCT_TYPE_LABEL } from '@/lib/catalog/labels';
import { getActiveCategories, getProductBySlug, getRelatedProducts } from '@/lib/catalog/queries';
import { formatRupiah } from '@/lib/format';
import { getApprovedReviews } from '@/lib/reviews/queries';
import { getSiteUrl } from '@/lib/site-url';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} | Karsa Pandiga` : 'Produk tidak ditemukan | Karsa Pandiga',
    description: product ? product.description.slice(0, 160) || undefined : undefined,
  };
}

function leadTimeText(days: number): string {
  return days <= 0
    ? 'Siap dikirim setelah pembayaran terverifikasi'
    : `Dikerjakan sekitar ${days} hari setelah pembayaran terverifikasi`;
}

function weightText(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toString().replace('.', ',')} kg` : `${grams} g`;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related, reviews] = await Promise.all([
    getActiveCategories(),
    getRelatedProducts(product, 4),
    getApprovedReviews(product.id),
  ]);

  const category = categories.find((entry) => entry.id === product.category_id) ?? null;

  const images: GalleryImage[] = [];
  if (product.image_path) {
    images.push({ url: getPublicAssetUrl(product.image_path), alt: product.name });
  }
  product.gallery_paths.forEach((path, index) => {
    images.push({ url: getPublicAssetUrl(path), alt: `${product.name}, foto ${index + 2}` });
  });

  const stockLabel =
    product.stock <= 0 ? 'Stok habis' : product.stock <= 5 ? `Sisa ${product.stock}` : 'Stok tersedia';

  const specs: Array<[string, string]> = [];
  if (product.materials) specs.push(['Bahan', product.materials]);
  if (product.dimensions) specs.push(['Ukuran', product.dimensions]);
  if (product.weight_grams) specs.push(['Berat', weightText(product.weight_grams)]);

  const whatsappUrl =
    siteConfig.contact.whatsapp !== ''
      ? buildWhatsAppLink(
          siteConfig.contact.whatsapp,
          `Halo Karsa Pandiga, saya ingin bertanya tentang "${product.name}" (${getSiteUrl()}/products/${product.slug}).`
        )
      : '';

  const { delivery, service } = siteConfig;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/products"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-link"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali ke katalog
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={images} />

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <Link
                href={`/products?category=${category.slug}`}
                className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-ink-soft hover:underline"
              >
                {category.name}
              </Link>
            ) : null}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRODUCT_TYPE_BADGE_CLASS[product.product_type]}`}
            >
              {PRODUCT_TYPE_LABEL[product.product_type]}
            </span>
          </div>

          <h1 className="text-balance text-3xl font-extrabold tracking-tight">{product.name}</h1>

          {reviews.summary ? (
            <a href="#ulasan" className="inline-flex items-center gap-2 text-sm text-muted hover:text-link">
              <RatingStars value={reviews.summary.average} />
              {reviews.summary.average.toFixed(1).replace('.', ',')} ({reviews.summary.count} ulasan)
            </a>
          ) : null}

          <p className="text-3xl font-extrabold text-link">{formatRupiah(product.price)}</p>

          <p className="text-sm text-muted">
            {stockLabel} · {leadTimeText(product.lead_time_days)}
          </p>

          {product.description ? (
            <p className="whitespace-pre-line leading-relaxed text-ink-soft">{product.description}</p>
          ) : null}

          <AddToCartButton productId={product.id} stock={product.stock} />

          {specs.length > 0 ? (
            <dl className="divide-y divide-line border-y border-line text-sm">
              {specs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="space-y-2 rounded-xl bg-soft p-4 text-sm leading-relaxed text-ink-soft">
            <p>
              <span className="font-semibold text-ink">Pengiriman.</span> {delivery.school.method},{' '}
              {delivery.school.schedule.toLowerCase()} (gratis). Luar sekolah:{' '}
              {delivery.outside.weekdaySchedule.toLowerCase()}; {delivery.outside.weekendSchedule.toLowerCase()}.
            </p>
            <p>
              <span className="font-semibold text-ink">Pembayaran.</span> Dikonfirmasi maksimal{' '}
              {service.confirmationHours} jam pada jam balas.
            </p>
            <p>
              <span className="font-semibold text-ink">Retur.</span> {delivery.returnPolicy}
            </p>
          </div>

          {whatsappUrl !== '' ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-strong px-5 font-semibold transition hover:bg-soft"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Tanya produk ini via WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      <ProductReviews items={reviews.items} summary={reviews.summary} />

      {related.length > 0 ? (
        <section className="mt-16 border-t border-line pt-10" aria-labelledby="terkait">
          <h2 id="terkait" className="text-2xl font-extrabold tracking-tight">
            Produk lain yang mungkin kamu suka
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}