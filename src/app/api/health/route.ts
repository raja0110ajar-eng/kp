import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

/**
 * Pemeriksaan ringan yang menyentuh database. Dipanggil Vercel Cron tiap hari agar proyek
 * Supabase gratis tidak dijeda karena tidak aktif. Bila CRON_SECRET diatur, header wajib cocok.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const startedAt = Date.now();
  const supabase = createPublicClient();
  const { error } = await supabase
    .from('shipping_zones')
    .select('id', { head: true, count: 'exact' })
    .limit(1);

  if (error) {
    console.error('Health check gagal:', error.message);
    return NextResponse.json({ ok: false, error: 'database_unreachable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, durationMs: Date.now() - startedAt });
}