import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchNearbyPlaces } from '@/lib/overpass'
import { nearbyLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit'

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().min(500).max(5000).optional().default(3000)
  ),
})

const cache = new Map<string, { data: { places: Awaited<ReturnType<typeof fetchNearbyPlaces>> }; expiresAt: number }>()

const CACHE_TTL = 60 * 60 * 1000
const ERROR_CACHE_TTL = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  if (await checkRateLimit(nearbyLimiter, ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
    radius: searchParams.get('radius'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const { lat, lng, radius } = parsed.data
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radius}`
  const cached = cache.get(cacheKey)

  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } })
  }

  try {
    const places = await fetchNearbyPlaces(lat, lng, radius)
    const data = { places }
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL })

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Overpass error:', error)
    const data = { places: [], error: 'Could not fetch nearby places' }
    cache.set(cacheKey, { data, expiresAt: Date.now() + ERROR_CACHE_TTL })

    return NextResponse.json(
      data,
      {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  }
}
