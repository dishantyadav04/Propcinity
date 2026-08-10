const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'

/**
 * Builds an absolute canonical URL for a given site path.
 * Usage: canonicalUrl('/about') -> 'https://propcinity.in/about'
 */
export function canonicalUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return normalizedPath === '/' ? BASE_URL : `${BASE_URL}${normalizedPath}`
}
