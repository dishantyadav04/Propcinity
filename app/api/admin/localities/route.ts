import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getLocalitiesByCity, createLocality, updateLocality, deleteLocality } from '@/services/locations';

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

/** GET /api/admin/localities?city_id=<uuid> — list active localities for a city */
export async function GET(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const cityId = new URL(request.url).searchParams.get('city_id');
  if (!cityId) return NextResponse.json({ error: 'city_id is required' }, { status: 400 });
  const localities = await getLocalitiesByCity(cityId);
  return NextResponse.json({ localities });
}

/** POST /api/admin/localities — create a locality */
export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const body = await request.json().catch(() => null);
  if (!body?.city_id || !body?.name?.trim()) {
    return NextResponse.json({ error: 'city_id and name are required' }, { status: 400 });
  }
  try {
    const locality = await createLocality(body.city_id, body.name);
    return NextResponse.json({ locality }, { status: 201 });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ error: err.message || 'Failed to create locality' }, { status: 500 });
  }
}

/** PATCH /api/admin/localities?id=<uuid> — update a locality */
export async function PATCH(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    await updateLocality(id, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ error: err.message || 'Failed to update locality' }, { status: 500 });
  }
}

/** DELETE /api/admin/localities?id=<uuid> — delete a locality */
export async function DELETE(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  try {
    await deleteLocality(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ error: err.message || 'Failed to delete locality' }, { status: 500 });
  }
}
