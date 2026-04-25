/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled to prevent React 18 Strict Mode's double-invoke from causing
  // the Leaflet "Map container is already initialized" error in development.
  // NOTE: This is dev-only behaviour — Strict Mode is not active in production.
  reactStrictMode: false,

  serverExternalPackages: ['@anthropic-ai/sdk', 'openai', 'posthog-node'],


  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.propiq.in' },
    ],
  },

  compress: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/admin/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}

export default nextConfig
