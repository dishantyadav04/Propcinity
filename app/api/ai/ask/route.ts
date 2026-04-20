import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { askAI } from '@/lib/ai-fallback'
import { buildSystemPrompt } from '@/lib/prompts'
import { getProjectsByIds } from '@/services/projects'

const schema = z.object({
  question: z.string().trim().min(1).max(500),
  projectId: z.string().uuid(),
  compareProjectIds: z.array(z.string().uuid()).max(5).optional(),
})

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS_PER_HOUR = 20

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return false
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) return true
  entry.count += 1
  return false
}

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown'
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { question, projectId, compareProjectIds } = parsed.data
  const project = await getProjectsByIds([projectId]).then((result) => result[0] || null)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const compareProjects = compareProjectIds?.length
    ? await getProjectsByIds(compareProjectIds)
    : undefined

  const systemPrompt = buildSystemPrompt(project, compareProjects)
  const { answer, provider } = await askAI(question, systemPrompt)

  return NextResponse.json({ answer, provider })
}
