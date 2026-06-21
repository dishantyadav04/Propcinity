import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding, intentToEmbeddingText } from '@/services/recommendations'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { aiEmbedLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (await checkRateLimit(aiEmbedLimiter, `embed:${user.id}`)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.intent) {
      return NextResponse.json({ error: 'Missing intent' }, { status: 400 })
    }

    const { intent } = body

    // Build stable text + hash for this intent
    const intentText = intentToEmbeddingText(intent)
    const intentHash = Buffer.from(intentText).toString('base64').slice(0, 40)

    // 1. Check DB cache first — avoid re-calling OpenAI for same intent
    let intentEmbedding: number[] | null = null
    const { data: cachedRow } = await supabase
      .from('user_intent_embeddings')
      .select('embedding')
      .eq('intent_hash', intentHash)
      .maybeSingle()

    if (cachedRow?.embedding) {
      intentEmbedding = cachedRow.embedding
    } else {
      // 2. Generate via OpenAI
      intentEmbedding = await generateEmbedding(intentText)

      // 3. Persist to DB so future visits skip OpenAI call
      if (intentEmbedding) {
        await supabase.from('user_intent_embeddings').upsert({
          intent_hash: intentHash,
          embedding: intentEmbedding,
          user_id: user.id,
        }, { onConflict: 'intent_hash' })
      }
    }

    if (!intentEmbedding) {
      // OpenAI unavailable — client falls back to JS scorer
      return NextResponse.json({ recommendedIds: [], source: 'fallback' })
    }

    // 4. Vector search — only query_embedding + match_count (no match_threshold)
    const { data: matches, error: matchError } = await supabase.rpc('match_projects', {
      query_embedding: intentEmbedding,
      match_count: 20,
    })

    if (matchError || !matches) {
      console.error('[embed] match_projects error:', matchError)
      return NextResponse.json({ recommendedIds: [], source: 'fallback' })
    }

    const recommendedIds = (matches as { id: string }[]).map(m => m.id)
    return NextResponse.json({ recommendedIds, source: 'vector', intentHash })

  } catch (err) {
    console.error('[embed] Unhandled error:', err)
    return NextResponse.json({ recommendedIds: [], source: 'error' })
  }
}
