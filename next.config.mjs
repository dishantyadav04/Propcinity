/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ['openai', 'posthog-node'],

  allowedDevOrigins: ['192.168.1.33', 'localhost'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.propcinity.in' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },

  compress: true,

  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

    const cspDirectives = [
      "default-src 'self'",
      // Scripts: self + inline (needed for Next.js hydration) — tighten with nonces post-launch
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + inline (Tailwind requires this)
      "style-src 'self' 'unsafe-inline'",
      // Images: self, data URIs, R2 bucket, Supabase storage
      `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''} https://*.supabase.co https://*.supabase.in https://*.r2.dev https://*.r2.cloudflarestorage.com https://images.propcinity.in https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com`,
      // API connections
      [
        "connect-src 'self'",
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        'https://api.openai.com',
        process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        'https://overpass-api.de',
        'https://*.tile.openstreetmap.org',
        isDev ? 'ws://localhost:*' : '',
      ].filter(Boolean).join(' '),
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',                value: 'DENY' },
          { key: 'X-Content-Type-Options',          value: 'nosniff' },
          { key: 'Referrer-Policy',                 value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection',               value: '1; mode=block' },
          { key: 'Permissions-Policy',              value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Content-Security-Policy',         value: cspDirectives },
          ...(!isDev ? [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
          ] : []),
        ],
      },
      {
        source: '/admin/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

export default nextConfig
