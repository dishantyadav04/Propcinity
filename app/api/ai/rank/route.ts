import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rankAI } from '@/lib/ai-fallback'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { aiRankLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit'
import { getRedis } from '@/lib/redis'

const AI_RANK_CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds

const RankRequestSchema = z.object({
  intentHash: z.string().min(1).max(100),
  intent: z.object({
    city: z.string(),
    subLocations: z.array(z.string()),
    purpose: z.string(),
    propertyType: z.array(z.string()),
    bhkType: z.array(z.string()),
    budget: z.object({
      min: z.number(),
      max: z.number(),
      isOpenMax: z.boolean().optional(),
    }),
    timeline: z.string(),
    preferences: z.array(z.string()),
    workLocation: z.string().optional(),
  }),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
    unitTypes: z.string(),
    priceMin: z.number(),
    priceMax: z.number(),
    possessionDate: z.string().nullable(),
    constructionStatus: z.string(),
    constructionPercent: z.number(),
    reraStatus: z.string(),
    amenities: z.array(z.string()),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  })).max(15),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rankResult = await checkRateLimit(aiRankLimiter, `rank:${ip}`)
  if (rankResult.limited) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rankResult.retryAfter }, { status: 429 })
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = RankRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { intentHash, intent, projects } = parsed.data

  // Check Upstash server-side cache first
  const redis = getRedis()
  const cacheKey = `ai_rank:${user.id}:${intentHash}`
  if (redis) {
    const cached = await redis.get<{
      ranked: string[]
      reasoning: Record<string, string>
      excluded: string[]
      excludedReason: Record<string, string>
    }>(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }
  }

  // Build budget label for prompt
  const bMin = intent.budget?.min || 0;
  const bMax = intent.budget?.max || 0;
  const budgetLabel = intent.budget?.isOpenMax
    ? `₹${(bMin / 100000).toFixed(0)}L+`
    : bMax > 0
    ? `₹${(bMin / 100000).toFixed(0)}L – ₹${(bMax / 100000).toFixed(0)}L`
    : 'Flexible budget';

  const timelineLabel: Record<string, string> = {
    under_1_year: 'needs possession within 12 months',
    '1_to_2_years': 'can wait 1–2 years for possession',
    '3_to_5_years': 'flexible, 3–5 year horizon',
    '5_plus': 'long-term investor, 5+ years',
  }

  const systemPrompt = `You are a senior real estate advisor at Propcinity, a zero-brokerage property platform in India.
Re-rank a shortlist of properties for a specific buyer based on their complete profile.

RANKING RULES (in priority order):
1. Timeline is hard: buyer needing possession in <12 months → construction-stage projects below 80% must rank last
2. Purpose: investment buyers → prioritise RERA-registered, high-demand locations, rental yield; self-use buyers → amenities, school proximity, commute to stated work location
3. Preferences are real signals: match amenities list against stated preferences semantically (gated community, school, metro, parking etc)
4. Work location: if provided, projects physically closer to work location rank higher
5. RERA status: registered > under-review > expired > not_registered — never rank expired RERA in top 3
6. Budget: projects 10–20% over budget may appear but must stay in bottom half unless exceptional on all other signals

OUTPUT: Return ONLY valid JSON, no markdown, no extra text:
{
  "ranked": ["id1", "id2", ...],
  "reasoning": {
    "id1": "one sentence specific to this buyer — not generic",
    "id2": "one sentence",
    ...
  },
  "excluded": ["id_x"],
  "excludedReason": { "id_x": "why excluded" }
}`

  const userPrompt = `BUYER PROFILE:
- Location: ${intent.subLocations.join(', ') || intent.city}
- Purpose: ${intent.purpose}
- Property type: ${intent.propertyType.join(', ')}
- BHK wanted: ${intent.bhkType.join(', ')}
- Budget: ${budgetLabel}
- Timeline: ${timelineLabel[intent.timeline] || intent.timeline}
- Preferences: ${intent.preferences.join(', ') || 'none stated'}
- Work location: ${intent.workLocation || 'not specified'}

PROPERTIES TO RE-RANK (already JS pre-screened):
${JSON.stringify(projects, null, 2)}

Return JSON only.`

  try {
    const { answer } = await rankAI(userPrompt, systemPrompt)
    if (answer === '{}') {
      return NextResponse.json({ error: 'AI ranking unavailable' }, { status: 503 })
    }

    const result = JSON.parse(answer)
    const response = {
      ranked: (result.ranked || []) as string[],
      reasoning: (result.reasoning || {}) as Record<string, string>,
      excluded: (result.excluded || []) as string[],
      excludedReason: (result.excludedReason || {}) as Record<string, string>,
    }

    // Cache in Upstash for 24h
    if (redis) {
      await redis.set(cacheKey, response, { ex: AI_RANK_CACHE_TTL })
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[ai/rank] Failed:', err)
    return NextResponse.json({ error: 'Ranking failed' }, { status: 500 })
  }
}
