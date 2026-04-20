import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for heavy server-side packages to work in Next.js edge runtime
  serverExternalPackages: ['@anthropic-ai/sdk', 'openai', 'posthog-node'],

  // Cloudflare R2 CDN domain — required for next/image to serve project photos
  images: {
    domains: ['images.propiq.in'],
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
        // Prevent search engines from indexing the admin panel
        source: '/admin/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}

export default nextConfig
