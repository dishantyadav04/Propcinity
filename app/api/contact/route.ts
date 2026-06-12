import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { getClientIp } from '@/lib/rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const contactSchema = z.object({
  name:    z.string().trim().min(2).max(100),
  email:   z.string().email().optional().or(z.literal('')),
  phone:   z.string().max(20).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5).max(2000),
})

// Separate limiter: 5 contact submissions per hour per IP
let contactLimiter: Ratelimit | null = null
function getContactLimiter() {
  if (contactLimiter) return contactLimiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  contactLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(5, '1 h'),
  })
  return contactLimiter
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIp(req)
  const limiter = getContactLimiter()
  if (limiter) {
    const { success } = await limiter.limit(`contact:${ip}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    console.warn('[contact] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const { name, email, phone, subject, message } = parsed.data

  const supabase = createAdminSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { error } = await supabase.from('contact_messages').insert({
    name,
    email: email || null,
    phone: phone || null,
    subject: subject || null,
    message,
  })

  if (error) {
    console.error('Contact insert error:', error)
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
