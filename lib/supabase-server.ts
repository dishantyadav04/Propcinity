import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// NOTE: Do not call this from generateStaticParams or any function that
// Next.js may execute at build time — it reads cookies() and will throw.
// Use createStaticSupabaseClient() for build-time-safe queries instead.
export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.delete({ name, ...options })
        } catch (error) {}
      },
    },
  })
}

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  return createServerClient(url, key, {
    cookies: {
      get: () => undefined,
      set: () => undefined,
      remove: () => undefined,
    },
  })
}

// Cookie-free client safe to call from generateStaticParams / other build-time
// contexts. Uses the public anon key — only ever query public tables/views
// with this client. Never pass user-scoped or RLS-sensitive queries through it.
export function createStaticSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  return createClient(url, key)
}
