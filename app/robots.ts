import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          // Signed-in-only pages — no public content to index, and
          // unauthenticated crawlers just get redirected to /auth/signin.
          '/dashboard/',
          '/profile/',
          '/saved/',
          '/onboarding/',
          '/ai-chat/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}