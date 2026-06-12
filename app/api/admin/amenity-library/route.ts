import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth();
  const supabase = createAdminSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { data, error } = await supabase
    .from('amenity_library')
    .select('*')
    .order('name');
  if (error) {
    console.error('[admin/amenity-library] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  const amenities = (data || []).map((row: any) => ({
    id: row.id, name: row.name, icon: row.icon, category: row.category,
  }));
  return NextResponse.json({ amenities });
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth();
  const body = await req.json();
  const { name, icon, category } = body;
  if (!name || !icon || !category) {
    return NextResponse.json({ error: 'name, icon, category required' }, { status: 400 });
  }
  const supabase = createAdminSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { data, error } = await supabase
    .from('amenity_library')
    .insert({ name, icon, category })
    .select()
    .single();
  if (error) {
    console.error('[admin/amenity-library] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  return NextResponse.json({ amenity: { id: data.id, name: data.name, icon: data.icon, category: data.category } });
}
