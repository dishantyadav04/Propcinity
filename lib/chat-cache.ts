// In-memory cache for AI Chat responses
// Prevents paying for duplicate questions
// Resets on server restart (acceptable — this is a cost optimization, not a data store)

interface CacheEntry {
  answer: string;
  provider: string;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hour TTL

export function getChatCache(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setChatCache(key: string, answer: string, provider: string): void {
  cache.set(key, { answer, provider, ts: Date.now() });
  // Cleanup old entries if cache grows too large
  if (cache.size > 500) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].ts - b[1].ts)
      .slice(0, 100)
      .map(([k]) => k);
    oldest.forEach(k => cache.delete(k));
  }
}

export function makeCacheKey(question: string, projectId?: string): string {
  const base = `${question.toLowerCase().trim()}|${projectId || 'general'}`;
  // Simple hash — not cryptographic, just for deduplication
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0;
  }
  return `chat_${Math.abs(hash)}`;
}
