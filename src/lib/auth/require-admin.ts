import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// cache(): dalam satu request, pengecekan admin hanya dijalankan sekali walau dipanggil berkali-kali.
export const requireAdmin = cache(async (): Promise<{ userId: string }> => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    redirect('/login?next=/admin');
  }

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || isAdmin !== true) {
    redirect('/');
  }

  return { userId };
});