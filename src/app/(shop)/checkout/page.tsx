import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { getActivePaymentSettings, getActiveShippingZones } from '@/lib/catalog/queries';

export default async function CheckoutPage() {
  const [zones, paymentSettings] = await Promise.all([
    getActiveShippingZones(),
    getActivePaymentSettings(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Checkout</h1>
      <CheckoutForm zones={zones} paymentSettings={paymentSettings} />
    </main>
  );
}