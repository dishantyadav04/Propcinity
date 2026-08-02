import { NextRequest, NextResponse } from 'next/server';
import { getLocalitiesByCity } from '@/services/locations';

/**
 * GET /api/locations/localities?city_id=<uuid>
 * Public, read-only. Returns all active localities for the selected city.
 */
export async function GET(request: NextRequest) {
  const cityId = new URL(request.url).searchParams.get('city_id');

  if (!cityId) {
    return NextResponse.json({ error: 'city_id is required' }, { status: 400 });
  }

  const localities = await getLocalitiesByCity(cityId);
  return NextResponse.json({ localities });
}
