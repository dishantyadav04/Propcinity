/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ['@anthropic-ai/sdk', 'openai', 'posthog-node'],

  allowedDevOrigins: ['192.168.1.33', 'localhost'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.propicinity.in' },
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
