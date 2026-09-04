import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { noStore } from '@/lib/cache-control'

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const [
    { count: projectCount },
    { count: builderCount },
    { count: leadCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('builders').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
  ])

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: leadsData } = await supabase
    .from('leads')
    .select('intent_label, created_at, status')
    .order('created_at', { ascending: false })

  const leads = leadsData || []
  const hot = leads.filter(l => l.intent_label === 'hot').length
  const warm = leads.filter(l => l.intent_label === 'warm').length
  const cold = leads.filter(l => l.intent_label === 'cold').length
  const new7d = leads.filter(l => l.created_at >= weekAgo).length

  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, name, phone, status, intent_label, created_at, projects(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    projects: projectCount ?? 0,
    builders: builderCount ?? 0,
    users: userCount ?? 0,
    leads: { total: leadCount ?? 0, hot, warm, cold, new7d },
    recentLeads: recentLeads || [],
  }, noStore())
}
