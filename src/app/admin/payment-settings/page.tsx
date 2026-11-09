import { PaymentSettingForm } from '@/components/admin/PaymentSettingForm';
import { getAdminPaymentSettings } from '@/lib/admin/queries';
import type { OnlinePaymentMethod } from '@/types/catalog';

const METHODS: ReadonlyArray<{ method: OnlinePaymentMethod; label: string; order: number }> = [
  { method: 'qris', label: 'QRIS', order: 1 },
  { method: 'dana', label: 'DANA', order: 2 },
  { method: 'ovo', label: 'OVO', order: 3 },
  { method: 'gopay', label: 'GoPay', order: 4 },
  { method: 'bank_transfer', label: 'Transfer bank', order: 5 },
];

export default async function AdminPaymentSettingsPage() {
  const settings = await getAdminPaymentSettings();
  const byMethod = new Map(settings.map((setting) => [setting.method, setting] as const));

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Setelan pembayaran</h1>
        <p className="text-sm text-neutral-600">
          Tujuan pembayaran yang dilihat pembeli setelah checkout. COD selalu tersedia dan tidak perlu
          diatur. Metode hanya bisa diaktifkan jika datanya lengkap (QRIS wajib bergambar, lainnya wajib
          bernomor).
        </p>
      </header>

      {METHODS.map((item) => (
        <PaymentSettingForm
          key={item.method}
          method={item.method}
          initial={byMethod.get(item.method) ?? null}
          defaultDisplayName={item.label}
          defaultSortOrder={item.order}
        />
      ))}
    </main>
  );
}