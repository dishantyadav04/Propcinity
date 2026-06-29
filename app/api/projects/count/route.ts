import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ count: 0 })

  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  return NextResponse.json(
    { count: count ?? 0 },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
  )
}
