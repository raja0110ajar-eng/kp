import { CartView } from '@/components/cart/CartView';

export default function CartPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Keranjang</h1>
      <CartView />
    </main>
  );
}