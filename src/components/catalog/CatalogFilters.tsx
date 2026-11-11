import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Category } from '@/types/catalog';

interface CatalogFiltersProps {
  categories: Category[];
  activeSlug: string | null;
  query: string;
}

export function CatalogFilters({ categories, activeSlug, query }: CatalogFiltersProps) {
  function hrefFor(slug: string | null): string {
    const params = new URLSearchParams();
    if (slug) params.set('category', slug);
    if (query) params.set('q', query);
    const search = params.toString();
    return search ? `/products?${search}` : '/products';
  }

  const tabs: ReadonlyArray<{ label: string; slug: string | null }> = [
    { label: 'Semua', slug: null },
    ...categories.map((category) => ({ label: category.name, slug: category.slug })),
  ];

  return (
    <div className="space-y-4">
      <form action="/products" method="get" className="flex gap-2">
        {activeSlug ? <input type="hidden" name="category" value={activeSlug} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={60}
          placeholder="Cari produk…"
          aria-label="Cari produk"
          className="min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-base text-ink focus:border-primary"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-white transition hover:bg-primary-hover"
        >
          <Search className="h-4 w-4" aria-hidden />
          Cari
        </button>
      </form>

      {categories.length > 0 ? (
        <nav aria-label="Filter kategori" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {tabs.map((tab) => {
            const active = tab.slug === activeSlug;
            return (
              <Link
                key={tab.label}
                href={hrefFor(tab.slug)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition ${
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-line-strong hover:bg-soft'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}