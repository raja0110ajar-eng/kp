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
  // Header keamanan dasar. CSP penuh sengaja belum dipasang: OCR memuat data dari CDN
  // dan skrip tema berjalan inline, jadi CSP yang terlalu ketat bisa mematikan fitur itu.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;