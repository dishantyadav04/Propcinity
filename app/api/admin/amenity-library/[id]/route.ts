import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated(req)) return unauth();
  const supabase = createAdminSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { name, icon, category } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const { data, error } = await supabase
    .from('amenity_library')
    .update({ name: name.trim(), icon: icon || '✨', category: category || 'both' })
    .eq('id', (await params).id)
    .select()
    .single();

  if (error) {
    console.error('[admin/amenity-library] PATCH error:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
  return NextResponse.json({ amenity: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated(req)) return unauth();
  const supabase = createAdminSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { error } = await supabase.from('amenity_library').delete().eq('id', (await params).id);
  if (error) {
    console.error('[admin/amenity-library] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true });
}
