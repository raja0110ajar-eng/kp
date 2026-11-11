import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { ProductCard } from '@/components/catalog/ProductCard';
import { getActiveCategories, getActiveProducts } from '@/lib/catalog/queries';

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = firstValue(params.q).trim().slice(0, 60);
  const requestedSlug = firstValue(params.category);

  const categories = await getActiveCategories();
  const activeCategory = categories.find((category) => category.slug === requestedSlug) ?? null;

  const products = await getActiveProducts({ categoryId: activeCategory?.id ?? null, query });

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {activeCategory ? activeCategory.name : 'Katalog'}
        </h1>
        <p className="text-muted">Karya kelompok kami dan produk reseller mitra.</p>
      </header>

      <CatalogFilters categories={categories} activeSlug={activeCategory?.slug ?? null} query={query} />

      {products.length === 0 ? (
        <p className="rounded-2xl bg-soft p-8 text-center text-muted">
          Belum ada produk yang cocok. Coba kategori lain atau kata kunci berbeda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </ul>
      )}
    </main>
  );
}