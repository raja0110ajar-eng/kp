import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { ProductActiveToggle } from '@/components/admin/ProductActiveToggle';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { primaryButtonClass } from '@/components/admin/styles';
import { getAdminProducts } from '@/lib/admin/queries';
import { getPublicAssetUrl } from '@/lib/assets';
import { PRODUCT_TYPE_LABEL } from '@/lib/catalog/labels';
import { formatRupiah } from '@/lib/format';

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Produk</h1>
          <p className="text-sm text-neutral-600">
            {products.length} produk. Produk tidak dihapus permanen, hanya dinonaktifkan.
          </p>
        </div>
        <Link href="/admin/products/new" className={primaryButtonClass}>
          <Plus className="h-4 w-4" aria-hidden />
          Tambah produk
        </Link>
      </header>

      {products.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-neutral-600">Belum ada produk.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 text-neutral-400">
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
                          className="font-semibold text-[#0066FF] hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-neutral-500">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p>{PRODUCT_TYPE_LABEL[product.productType]}</p>
                    {product.productType === 'reseller' ? (
                      <p className="text-xs text-neutral-500">
                        {product.resellerName ?? 'Reseller belum diisi'}
                        {product.costPrice !== null ? ` · modal ${formatRupiah(product.costPrice)}` : ''}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatRupiah(product.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.stock <= 5 ? 'font-bold text-[#FF6B00]' : 'font-semibold text-neutral-800'
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={product.isActive ? 'green' : 'neutral'}>
                      {product.isActive ? 'Aktif' : 'Nonaktif'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <ProductActiveToggle productId={product.id} isActive={product.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}