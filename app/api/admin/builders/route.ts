import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { cleanupRemovedR2Files } from '@/lib/r2'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const { data, error } = await supabase
    .from('builders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[admin/builders] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  return NextResponse.json({ builders: data })
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth()
  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { data, error } = await supabase
    .from('builders')
    .insert({
      ...body,
      builder_score: 0,
      score_breakdown: {},
    })
    .select()
    .single()

  if (error) {
    console.error('[admin/builders] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  return NextResponse.json({ builder: data })
}

export async function PUT(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  // 1. Fetch current logo before overwriting
  const { data: existing } = await supabase
    .from('builders')
    .select('logo')
    .eq('id', id)
    .single()

  // 2. Write the update
  const { data, error } = await supabase
    .from('builders')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[admin/builders] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }

  // 3. Delete orphaned R2 logo if it changed (fire-and-forget)
  if (existing) {
    cleanupRemovedR2Files(
      [existing.logo],
      [body.logo ?? null]
    ).catch(() => {})
  }

  return NextResponse.json({ builder: data })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const { error } = await supabase.from('builders').delete().eq('id', id)
  if (error) {
    console.error('[admin/builders] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
