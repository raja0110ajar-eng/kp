import { CategoryForm } from '@/components/admin/CategoryForm';
import { getAdminCategories } from '@/lib/admin/extra-queries';

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Kategori produk</h1>
        <p className="text-sm text-muted">
          Kategori tampil sebagai filter di katalog. Nama boleh diganti kapan saja. Kategori yang
          dinonaktifkan hilang dari filter, dan produknya tetap tampil di katalog.
        </p>
      </header>

      <CategoryForm category={null} />

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Kategori yang ada ({categories.length})</h2>
        {categories.map((category) => (
          <CategoryForm key={category.id} category={category} />
        ))}
      </section>
    </main>
  );
}