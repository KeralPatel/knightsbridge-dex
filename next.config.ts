import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: ['assets.coingecko.com', 'raw.githubusercontent.com', 'ipfs.io'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.0x.org https://*.alchemy.com https://*.infura.io",
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-RateLimit-Policy', value: 'sliding-window' },
        ],
      },
    ]
  },
}

export default nextConfig
