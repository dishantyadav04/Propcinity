import { NextResponse } from 'next/server';
import { getCities } from '@/services/locations';

/**
 * GET /api/locations/cities
 * Public, read-only. Returns all active cities for public-facing pages
 * such as onboarding and search filters.
 */
export async function GET() {
  const cities = await getCities();
  return NextResponse.json({ cities });
}
