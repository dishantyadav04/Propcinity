import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { cached } from '@/lib/server-cache'
import { CACHE_PRESETS } from '@/lib/cache-control'

async function fetchCount(): Promise<number> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return 0

  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  return count ?? 0
}

export async function GET() {
  const count = await cached('projects:count', 5 * 60 * 1000, fetchCount, {
    staleWhileRevalidateMs: 10 * 60 * 1000,
  })

  return NextResponse.json({ count }, { headers: CACHE_PRESETS.LISTING })
}