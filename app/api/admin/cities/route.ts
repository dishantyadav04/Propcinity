import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getCities, createCity, updateCity, deleteCity } from '@/services/locations';

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

/** GET /api/admin/cities — list all active cities */
export async function GET(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const cities = await getCities();
  return NextResponse.json({ cities });
}

/** POST /api/admin/cities — create a new city */
export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  try {
    const city = await createCity(body.name, body.state);
    return NextResponse.json({ city }, { status: 201 });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ error: err.message || 'Failed to create city' }, { status: 500 });
  }
}

/** PATCH /api/admin/cities?id=<uuid> — update a city */
export async function PATCH(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    await updateCity(id, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ error: err.message || 'Failed to update city' }, { status: 500 });
  }
}

/** DELETE /api/admin/cities?id=<uuid> — delete a city (cascades localities) */
export async function DELETE(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  try {
    await deleteCity(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ error: err.message || 'Failed to delete city' }, { status: 500 });
  }
}
