import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated(request))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const replySchema = z.object({
    messageId: z.string().uuid(),
    replyBody: z.string().trim().min(1).max(5000),
  })
  const body = await request.json().catch(() => null)
  const parsed = replySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { messageId, replyBody } = parsed.data

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  const { data: msg } = await supabase
    .from('contact_messages')
    .select('name, email')
    .eq('id', messageId)
    .single()

  if (!msg?.email) return NextResponse.json({ error: 'No email on record' }, { status: 400 })

  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY not configured')

    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'Propcinity <hello@propcinity.com>',
      to: msg.email,
      subject: 'Re: Your message to Propcinity',
      text: replyBody,
    })
  } catch (err) {
    console.error('[contact/reply] Resend failed:', err)
    return NextResponse.json({ error: 'Failed to send reply email' }, { status: 500 })
  }

  await supabase
    .from('contact_messages')
    .update({ status: 'replied' })
    .eq('id', messageId)

  return NextResponse.json({ success: true })
}
