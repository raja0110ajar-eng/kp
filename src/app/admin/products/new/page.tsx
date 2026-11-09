import { ProductForm } from '@/components/admin/ProductForm';
import { cardClass } from '@/components/admin/styles';

export default function NewProductPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Tambah produk</h1>
      <section className={cardClass}>
        <ProductForm product={null} />
      </section>
    </main>
  );
}