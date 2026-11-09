import { ZoneForm } from '@/components/admin/ZoneForm';
import { getAdminShippingZones } from '@/lib/admin/queries';

export default async function AdminShippingPage() {
  const zones = await getAdminShippingZones();

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Tarif kurir luar sekolah</h1>
        <p className="text-sm text-muted">
          Area sekolah selalu gratis. Zona di bawah hanya dipakai untuk pengantaran ke luar sekolah.
          Zona tidak dihapus: nonaktifkan agar tidak muncul di checkout.
        </p>
      </header>

      <ZoneForm zone={null} />

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Zona yang ada ({zones.length})</h2>
        {zones.length === 0 ? (
          <p className="rounded-2xl bg-surface p-8 text-center text-muted">Belum ada zona.</p>
        ) : (
          zones.map((zone) => <ZoneForm key={zone.id} zone={zone} />)
        )}
      </section>
    </main>
  );
}