import { PayOrderClient } from '@/components/checkout/PayOrderClient';
import { getActivePaymentSettings } from '@/lib/catalog/queries';

export default async function PayOrderPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode } = await params;
  const paymentSettings = await getActivePaymentSettings();

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <PayOrderClient orderCode={orderCode} paymentSettings={paymentSettings} />
    </main>
  );
}