import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, subject, message } = body

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name and message are required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
    })

    if (error) {
      console.error('Contact insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
