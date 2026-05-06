import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const { data, error } = await supabase
    .from('builders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ builders: data })
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { data, error } = await supabase
    .from('builders')
    .insert({
      ...body,
      builder_score: 0, // Legacy field, setting to 0
      score_breakdown: {}, // Legacy field
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ builder: data })
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { data, error } = await supabase
    .from('builders')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ builder: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const { error } = await supabase.from('builders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
