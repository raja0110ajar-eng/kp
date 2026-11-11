import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { cardClass } from '@/components/admin/styles';
import { getAdminCategories } from '@/lib/admin/extra-queries';
import { getAdminProduct } from '@/lib/admin/queries';
import { getBusinessSettings } from '@/lib/admin/reports';
import { UUID_REGEX } from '@/lib/admin/validation';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [product, categories, settings] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
    getBusinessSettings(),
  ]);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Ubah produk</h1>
      <section className={cardClass}>
        <ProductForm product={product} categories={categories} laborRatePerHour={settings.laborRatePerHour} />
      </section>
    </main>
  );
}