/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ['openai', 'posthog-node'],

  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS?.split(',') ?? ['localhost']).map(s => s.trim()),

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
      // TODO: Replace 'unsafe-inline' with nonce-based CSP post-launch
      // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
      // PostHog SDK requires unsafe-eval for session recording and feature flags.
      // blob: is needed for PostHog's worker-based session recording scripts.
      // Both us-assets.i.posthog.com and us.i.posthog.com host lazy-loaded SDK bundles.
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://us-assets.i.posthog.com https://us.i.posthog.com ${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ingest.propcinity.in'}`,
      // Styles: self + inline (Tailwind requires this)
      "style-src 'self' 'unsafe-inline'",
      // Images: self, data URIs, R2 bucket, Supabase storage
      `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''} https://*.supabase.co https://*.supabase.in https://*.r2.dev https://*.r2.cloudflarestorage.com https://images.propcinity.in https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com ${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ingest.propcinity.in'} https://us.i.posthog.com`,
      // API connections
      [
        "connect-src 'self'",
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        'https://api.openai.com',
        // PostHog ingestion host (events)
        process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ingest.propcinity.in',
        // PostHog assets host (decide endpoint — feature flags, session recording)
        'https://us-assets.i.posthog.com',
        // PostHog UI host (toolbar, debug, project dashboard)
        'https://us.posthog.com',
        'https://overpass-api.de',
        'https://*.tile.openstreetmap.org',
        isDev ? 'ws://localhost:*' : '',
      ].filter(Boolean).join(' '),
      "font-src 'self' data:",
      `worker-src 'self' blob: ${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://ingest.propcinity.in'} https://us-assets.i.posthog.com https://us.i.posthog.com`,
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

const { withSentryConfig } = await import('@sentry/nextjs')

export default withSentryConfig(nextConfig, {
  org: "propcinity",
  project: "propcinity",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  telemetry: false,

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
