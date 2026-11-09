import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { ProductCard } from '@/components/catalog/ProductCard';
import { getActiveProducts } from '@/lib/catalog/queries';
import type { ProductType } from '@/types/domain';

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const rawType = firstValue(params.type);
  const type: ProductType | null =
    rawType === 'own_product' || rawType === 'reseller' ? rawType : null;
  const query = firstValue(params.q).trim().slice(0, 60);

  const products = await getActiveProducts({ type, query });

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Katalog</h1>
        <p className="text-muted">Karya kelompok kami dan produk reseller mitra.</p>
      </header>

      <CatalogFilters type={type} query={query} />

      {products.length === 0 ? (
        <p className="rounded-xl bg-soft p-8 text-center text-muted">
          Tidak ada produk yang cocok dengan pencarianmu.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </main>
  );
}