import { NextResponse } from 'next/server';
import { getCities } from '@/services/locations';
import { cached } from '@/lib/server-cache';
import { CACHE_PRESETS } from '@/lib/cache-control';

/**
 * GET /api/locations/cities
 * Public, read-only. Returns all active cities for public-facing pages
 * such as onboarding and search filters. Cities change rarely, so this
 * uses the long-TTL REFERENCE preset.
 */
export async function GET() {
  const cities = await cached('locations:cities', 60 * 60 * 1000, getCities, {
    staleWhileRevalidateMs: 24 * 60 * 60 * 1000,
  });
  return NextResponse.json({ cities }, { headers: CACHE_PRESETS.REFERENCE });
}