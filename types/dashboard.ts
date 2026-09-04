export interface RecentLead {
  id: string
  name: string
  phone: string
  status: string
  intent_label: 'hot' | 'warm' | 'cold'
  created_at: string
  projects: { name: string } | null
}

export interface DashboardStats {
  projects: number
  builders: number
  users: number
  leads: {
    total: number
    hot: number
    warm: number
    cold: number
    new7d: number
  }
  recentLeads: RecentLead[]
}
