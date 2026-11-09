import Link from 'next/link';
import { Search } from 'lucide-react';
import type { ProductType } from '@/types/domain';

interface CatalogFiltersProps {
  type: ProductType | null;
  query: string;
}

const TABS: ReadonlyArray<{ label: string; value: ProductType | null }> = [
  { label: 'Semua', value: null },
  { label: 'Karya Kami', value: 'own_product' },
  { label: 'Reseller', value: 'reseller' },
];

export function CatalogFilters({ type, query }: CatalogFiltersProps) {
  function hrefFor(value: ProductType | null): string {
    const params = new URLSearchParams();
    if (value) params.set('type', value);
    if (query) params.set('q', query);
    const search = params.toString();
    return search ? `/products?${search}` : '/products';
  }

  return (
    <div className="space-y-4">
      <form action="/products" method="get" className="flex gap-2">
        {type ? <input type="hidden" name="type" value={type} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={60}
          placeholder="Cari produk…"
          aria-label="Cari produk"
          className="w-full rounded-lg border border-line-strong px-3 py-2 focus:border-primary"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-hover"
        >
          <Search className="h-4 w-4" aria-hidden />
          Cari
        </button>
      </form>

      <nav aria-label="Filter tipe produk" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.value === type;
          return (
            <Link
              key={tab.label}
              href={hrefFor(tab.value)}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-line-strong hover:border-muted'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}