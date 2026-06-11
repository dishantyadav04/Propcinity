import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { askAI } from '@/lib/ai-fallback'
import { buildSystemPrompt } from '@/lib/prompts'
import { getProjectsByIds } from '@/services/projects'
import { getChatCache, setChatCache, makeCacheKey } from '@/lib/chat-cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { aiAskLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  question: z.string().trim().min(1).max(500),
  projectId: z.string().uuid(),
  compareProjectIds: z.array(z.string().uuid()).max(5).optional(),
})

export async function POST(request: NextRequest) {
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

  // Check cache before hitting AI
  const cacheKey = makeCacheKey(question, projectId)
  const cached = getChatCache(cacheKey)
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
  setChatCache(cacheKey, answer, provider)

  return NextResponse.json({ answer, provider })
}

export async function PUT(request: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(request)
  if (await checkRateLimit(aiAskLimiter, ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  // ── Require authenticated session ────────────────────────────────────────
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // AI-powered project recommendations endpoint
  try {
    const { userIntent, projects } = await request.json()

    // Build a concise prompt with user preferences + project list
    const projectList = (projects || []).slice(0, 50).map((p: any) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      unitTypes: (p.unitConfigs || []).map((u: any) => u.type).join(', '),
      priceMin: p.unitConfigs?.[0]?.priceMin || 0,
      possession: p.possessionDate,
      reraStatus: p.reraStatus || 'not_registered',
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
    const parsed = JSON.parse(result.answer.replace(/```json|```/g, '').trim())

    return NextResponse.json({
      recommended: parsed.recommended || [],
      reasoning: parsed.reasoning || {},
      provider: result.provider,
    })
  } catch (err) {
    console.error('Recommendation failed:', err)
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 })
  }
}
