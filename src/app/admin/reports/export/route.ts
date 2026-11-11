import { buildSalesCsv, parseRange } from '@/lib/admin/reports';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await requireAdmin();

  const range = parseRange(new URL(request.url).searchParams.get('range') ?? '');
  const csv = await buildSalesCsv(range);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="penjualan-${range}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}