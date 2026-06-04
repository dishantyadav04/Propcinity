import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return unauth()

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')

  if (error) return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })

  const settings: Record<string, unknown> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }

  return NextResponse.json({ settings })
}

export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return unauth()

  const body = await request.json().catch(() => null)
  if (!body || !body.key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  await supabase
    .from('admin_settings')
    .upsert({ key: body.key, value: body.value, updated_at: new Date().toISOString() })

  return NextResponse.json({ success: true })
}
