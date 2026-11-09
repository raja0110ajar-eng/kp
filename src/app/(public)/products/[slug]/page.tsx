import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { ProductImage } from '@/components/catalog/ProductImage';
import { PRODUCT_TYPE_BADGE_CLASS, PRODUCT_TYPE_LABEL } from '@/lib/catalog/labels';
import { getProductBySlug } from '@/lib/catalog/queries';
import { formatRupiah } from '@/lib/format';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} | Karsa Pandiga` : 'Produk tidak ditemukan | Karsa Pandiga',
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stockLabel =
    product.stock <= 0 ? 'Stok habis' : product.stock <= 5 ? `Sisa ${product.stock}` : 'Stok tersedia';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-link"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali ke katalog
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line">
          <ProductImage path={product.image_path} alt={product.name} sizes="(min-width: 768px) 50vw, 100vw" />
        </div>

        <div className="space-y-4">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PRODUCT_TYPE_BADGE_CLASS[product.product_type]}`}
          >
            {PRODUCT_TYPE_LABEL[product.product_type]}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="text-2xl font-bold text-link">{formatRupiah(product.price)}</p>
          <p className="text-sm font-medium text-muted">{stockLabel}</p>
          {product.description ? (
            <p className="whitespace-pre-line text-ink-soft">{product.description}</p>
          ) : null}
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>
    </main>
  );
}