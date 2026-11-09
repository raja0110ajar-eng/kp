import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL belum diisi (lihat .env.example).');
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(supabaseUrl).hostname,
        port: '',
        pathname: '/storage/v1/object/public/public-assets/**',
        search: '',
      },
    ],
  },
  // Aturan Tailwind bawaan create-next-app 16.4. Tanpa ini, @theme dan kelas utilitas tidak diproses.
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;