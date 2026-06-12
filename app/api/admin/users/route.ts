import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { data: intents, error } = await supabase
    .from('user_intents')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[admin/users] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  return NextResponse.json({ users: intents })
}
