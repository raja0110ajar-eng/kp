import { ProductForm } from '@/components/admin/ProductForm';
import { cardClass } from '@/components/admin/styles';
import { getAdminCategories } from '@/lib/admin/extra-queries';
import { getBusinessSettings } from '@/lib/admin/reports';

export default async function NewProductPage() {
  const [categories, settings] = await Promise.all([getAdminCategories(), getBusinessSettings()]);

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Tambah produk</h1>
      <section className={cardClass}>
        <ProductForm product={null} categories={categories} laborRatePerHour={settings.laborRatePerHour} />
      </section>
    </main>
  );
}