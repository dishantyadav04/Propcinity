import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('blogs')
    .update({ status: 'published', published_at: now })
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .select('id, slug, title')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ published: data?.length ?? 0, items: data })
}
