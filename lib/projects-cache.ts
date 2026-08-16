// Simple in-memory cache for /api/projects, scoped to the browser session.
// Mirrors the pattern already used in lib/ai-rank-cache.ts.
// Module-level, so it persists across client-side navigations (reset only on full page reload).

import { Project } from '@/types/project';

const CACHE_TTL = 60 * 1000; // 60s — long enough to survive quick tab-switching, short enough to stay fresh

let cache: { data: Project[]; ts: number } | null = null;

export function getCachedProjects(): Project[] | null {
  if (!cache) return null;
  if (Date.now() - cache.ts > CACHE_TTL) return null;
  return cache.data;
}

export function setCachedProjects(data: Project[]) {
  cache = { data, ts: Date.now() };
}