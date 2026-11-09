import { createClient } from '@supabase/supabase-js';
import { supabaseEnv } from '@/lib/supabase/env';

/** Untuk membaca data publik (RLS tetap berlaku). Tidak memakai cookie, jadi aman dipakai di halaman statis. */
export function createPublicClient() {
  return createClient(supabaseEnv.url, supabaseEnv.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}