import { NextRequest, NextResponse } from 'next/server';
import { getLocalitiesByCity } from '@/services/locations';
import { cached } from '@/lib/server-cache';
import { CACHE_PRESETS, noStore } from '@/lib/cache-control';

/**
 * GET /api/locations/localities?city_id=<uuid>
 * Public, read-only. Returns all active localities for the selected city.
 */
export async function GET(request: NextRequest) {
  const cityId = new URL(request.url).searchParams.get('city_id');

  if (!cityId) {
    return NextResponse.json({ error: 'city_id is required' }, { status: 400, headers: noStore() });
  }

  const localities = await cached(
    `locations:localities:${cityId}`,
    60 * 60 * 1000,
    () => getLocalitiesByCity(cityId),
    { staleWhileRevalidateMs: 24 * 60 * 60 * 1000 }
  );
  return NextResponse.json({ localities }, { headers: CACHE_PRESETS.REFERENCE });
}