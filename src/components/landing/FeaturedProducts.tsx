import Link from 'next/link';
import { ProductCard } from '@/components/catalog/ProductCard';
import { getFeaturedProducts } from '@/lib/catalog/featured';

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(4);

  return (
    <section id="produk" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Karya terbaru dari kami</h2>
          <Link href="/products" className="text-sm font-semibold text-link underline-offset-4 hover:underline">
            Lihat semua produk
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-soft p-8 text-center text-muted">
            Produk sedang disiapkan. Segera hadir.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}