import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { FeaturedToggle } from '@/components/admin/FeaturedToggle';
import { ProductActiveToggle } from '@/components/admin/ProductActiveToggle';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { primaryButtonClass } from '@/components/admin/styles';
import { computeUnitCost } from '@/lib/admin/costing';
import { MAX_FEATURED, getFeaturedFlags } from '@/lib/admin/featured';
import { getAdminCategories } from '@/lib/admin/extra-queries';
import { getAdminProducts } from '@/lib/admin/queries';
import { getBusinessSettings } from '@/lib/admin/reports';
import { getPublicAssetUrl } from '@/lib/assets';
import { formatRupiah } from '@/lib/format';

export default async function AdminProductsPage() {
  const [products, categories, settings, featuredFlags] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getBusinessSettings(),
    getFeaturedFlags(),
  ]);
  const categoryName = new Map(categories.map((category) => [category.id, category.name] as const));
  const featuredCount = Object.values(featuredFlags).filter(Boolean).length;

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Produk</h1>
          <p className="text-sm text-muted">
            {products.length} produk. Produk tidak dihapus permanen, hanya dinonaktifkan. Karya unggulan di
            beranda dipilih manual: {featuredCount} dari maksimal {MAX_FEATURED}.
          </p>
        </div>
        <Link href="/admin/products/new" className={primaryButtonClass}>
          <Plus className="h-4 w-4" aria-hidden />
          Tambah produk
        </Link>
      </header>

      {products.length === 0 ? (
        <p className="rounded-2xl bg-surface p-10 text-center text-muted">Belum ada produk.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">HPP / margin</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Unggulan</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const unitCost = computeUnitCost(
                  {
                    costPrice: product.costPrice,
                    packagingCost: product.packagingCost,
                    laborMinutes: product.laborMinutes,
                  },
                  settings.laborRatePerHour
                );
                const margin = unitCost === null ? null : product.price - unitCost;
                const marginPercent =
                  margin !== null && product.price > 0 ? (margin / product.price) * 100 : null;

                return (
                  <tr key={product.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft text-muted">
                          {product.imagePath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getPublicAssetUrl(product.imagePath)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5" aria-hidden />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-semibold text-link hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.categoryId ? categoryName.get(product.categoryId) ?? '-' : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(product.price)}</td>
                    <td className="px-4 py-3">
                      {unitCost === null ? (
                        <span className="text-xs text-accent-ink">HPP belum diisi</span>
                      ) : (
                        <>
                          <p>{formatRupiah(unitCost)}</p>
                          <p className="text-xs text-muted">
                            margin {formatRupiah(margin ?? 0)}
                            {marginPercent !== null
                              ? ` (${marginPercent.toFixed(1).replace('.', ',')}%)`
                              : ''}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={product.stock <= 5 ? 'font-bold text-accent-ink' : 'font-semibold'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={product.isActive ? 'green' : 'neutral'}>
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {product.isActive ? (
                        <FeaturedToggle productId={product.id} featured={featuredFlags[product.id] === true} />
                      ) : (
                        <span className="text-xs text-muted">Aktifkan dulu</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ProductActiveToggle productId={product.id} isActive={product.isActive} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}