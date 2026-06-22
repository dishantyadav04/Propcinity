// app/api/ai/ask/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { askAI } from '@/lib/ai-fallback'
import { buildSystemPrompt } from '@/lib/prompts'
import { getProjectsByIds } from '@/services/projects'
import { getChatCache, setChatCache, makeCacheKey } from '@/lib/chat-cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { aiAskLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit'
import { getRedis } from '@/lib/redis'

const schema = z.object({
  question: z.string().trim().min(1).max(500),
  projectId: z.string().uuid(),
  compareProjectIds: z.array(z.string().uuid()).max(5).optional(),
})

const PutBodySchema = z.object({
  userIntent: z.object({
    budget: z.number().min(0).max(1000000000).optional(),
    budgetLabel: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    propertyTypes: z.array(z.string().max(50)).max(10).optional(),
    purpose: z.string().max(100).optional(),
    bedrooms: z.array(z.number()).max(10).optional(),
    mustHaves: z.array(z.string().max(100)).max(20).optional(),
    dealBreakers: z.array(z.string().max(100)).max(20).optional(),
  }).optional(),
  projects: z.array(z.object({
    id: z.string().uuid(),
  })).max(20).optional(),
})

const DAILY_LIMIT = 5

async function getUserChatCount(userId: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0
  const key = `ai_chats:${userId}:${new Date().toISOString().slice(0, 10)}`
  const count = await redis.get<number>(key)
  return count ?? 0
}

async function incrementUserChatCount(userId: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return 1
  const key = `ai_chats:${userId}:${new Date().toISOString().slice(0, 10)}`
  const newCount = await redis.incr(key)
  if (newCount === 1) {
    await redis.expire(key, 25 * 60 * 60)
  }
  return newCount
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.UPSTASH_REDIS_REST_URL) {
    console.error('[SECURITY] UPSTASH_REDIS_REST_URL is not set in production. Rate limiting is DISABLED.')
  }

  const ip = getClientIp(request)
  if (await checkRateLimit(aiAskLimiter, ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { question, projectId, compareProjectIds } = parsed.data

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const newCount = await incrementUserChatCount(user.id)
  if (newCount > DAILY_LIMIT) {
    return NextResponse.json(
      { error: `You've reached your ${DAILY_LIMIT} daily chat limit. Try again tomorrow.` },
      { status: 429 }
    )
  }

  // Check cache before hitting AI
  const cacheKey = makeCacheKey(question, projectId, user.id)
  const cached = await getChatCache(cacheKey)
  if (cached) {
    return NextResponse.json({ answer: cached.answer, provider: cached.provider, cached: true })
  }

  const project = await getProjectsByIds([projectId]).then((result) => result[0] || null)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const compareProjects = compareProjectIds?.length
    ? await getProjectsByIds(compareProjectIds)
    : undefined

  const systemPrompt = buildSystemPrompt(project, compareProjects)
  const { answer, provider } = await askAI(question, systemPrompt)

  // Cache the response for future identical questions
  await setChatCache(cacheKey, answer, provider)

  return NextResponse.json({ answer, provider })
}

export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.UPSTASH_REDIS_REST_URL) {
    console.error('[SECURITY] UPSTASH_REDIS_REST_URL is not set in production. Rate limiting is DISABLED.')
  }

  const ip = getClientIp(request)
  if (await checkRateLimit(aiAskLimiter, ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const newCount = await incrementUserChatCount(user.id)
  if (newCount > DAILY_LIMIT) {
    return NextResponse.json(
      { error: `You've reached your ${DAILY_LIMIT} daily chat limit. Try again tomorrow.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    const parsed = PutBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
    }
    const { userIntent, projects } = parsed.data

    const projectIds = (projects || []).slice(0, 50)
      .map((p: any) => typeof p?.id === 'string' ? p.id : null)
      .filter((id: string | null): id is string => id !== null && /^[0-9a-f-]{36}$/.test(id))

    if (!projectIds.length) {
      return NextResponse.json({ error: 'No valid projects provided' }, { status: 400 })
    }

    const dbProjects = await getProjectsByIds(projectIds)

    const projectList = dbProjects.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      unitTypes: (p.unitConfigs || []).map((u: any) => u.type).join(', '),
      priceMin: p.unitConfigs?.[0]?.priceMin || 0,
      possession: p.possessionDate,
      reraStatus: (p as any).reraStatus || 'not_registered',
      pros: (p.pros || []).slice(0, 2).join('; '),
      cons: (p.cons || []).slice(0, 1).join('; '),
    }))

    const systemPrompt = `You are a real estate recommendation engine for Propcinity, a zero-brokerage platform.
Given a buyer's preferences and a list of projects, return a JSON array of recommended project IDs sorted by best match.
Return ONLY valid JSON in this format: { "recommended": ["id1", "id2", ...], "reasoning": {"id1": "reason", ...} }
Do not return more than 10 IDs. Base recommendations on: location, budget, BHK preference, timeline.
Favor projects with reraStatus = "registered". Penalize expired or not_registered RERA status.
Always be honest - if a project doesn't match, don't include it.`

    const userPrompt = `Buyer preferences: ${JSON.stringify(userIntent)}
    
Available projects: ${JSON.stringify(projectList)}

Return JSON with recommended project IDs and a brief reason for each.`

    const result = await askAI(userPrompt, systemPrompt)
    const aiResponse = JSON.parse(result.answer.replace(/```json|```/g, '').trim())

    return NextResponse.json({
      recommended: aiResponse.recommended || [],
      reasoning: aiResponse.reasoning || {},
      provider: result.provider,
    })
  } catch (err) {
    console.error('Recommendation failed:', err)
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 })
  }
}
