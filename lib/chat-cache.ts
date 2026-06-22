// Upstash Redis cache for AI Chat responses
// Prevents paying for duplicate questions
// Falls back to null (cache miss) if Redis is unavailable

import { getRedis } from '@/lib/redis'

interface CacheEntry {
  answer: string;
  provider: string;
  ts: number;
}

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export async function getChatCache(key: string): Promise<CacheEntry | null> {
  try {
    const redis = getRedis()
    if (!redis) return null
    const entry = await redis.get<CacheEntry>(key)
    if (!entry) return null
    return entry
  } catch (err) {
    console.warn('[chat-cache] Redis get failed:', err)
    return null
  }
}

export async function setChatCache(key: string, answer: string, provider: string): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.set(key, { answer, provider, ts: Date.now() }, { px: CACHE_TTL })
  } catch (err) {
    console.warn('[chat-cache] Redis set failed:', err)
  }
}

export function makeCacheKey(question: string, projectId?: string, userId?: string): string {
  const base = `${question.toLowerCase().trim()}|${projectId || 'general'}|${userId || 'guest'}`
  // Simple hash — not cryptographic, just for deduplication
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0;
  }
  return `chat_${Math.abs(hash)}`
}
