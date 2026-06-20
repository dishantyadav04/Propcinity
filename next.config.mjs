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

// Sentry wrapping — configure org/project/token via env vars
const { withSentryConfig } = await import('@sentry/nextjs')

const sentryConfig = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  telemetry: false,
})

export default withSentryConfig(sentryConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "propcinity",

  project: "propcinity",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
