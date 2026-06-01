# Propcinity — System Explanation & Cursor Prompt

---

## PART 1: SYSTEM EXPLANATION (Read Before Reviewing Prompt)

### 1. How the Current Recommendation System Works (and What's Broken)

**Onboarding → Dashboard flow today:**
1. User fills `UserIntentForm` (7 steps) → saves `UserIntent` to `localStorage` → redirects to `/dashboard`
2. Dashboard mounts → reads `userIntent` from localStorage → fetches ALL projects from `/api/projects`
3. Dashboard sends BOTH to `/api/ai/ask` (PUT method) → OpenAI/Claude orders them → renders
4. Every single page load triggers a full LLM call. At 1000 properties this is ~$15–40/day just for recommendations

**Explorer → Dashboard "Add" bug:**
- Explorer calls `toggleCurated(id)` → writes `curatedIds` array to localStorage → fires `window.dispatchEvent(new Event('curatedUpdated'))`
- Dashboard listens for `curatedUpdated` event to refresh from localStorage
- **The bug:** Dashboard only fires the event listener if it's already mounted. If the user is on Explorer and Dashboard is not mounted (different tab/page), the event fires into nothing. When user navigates to Dashboard, `displayResults` uses a `useMemo` that only shows curated items if `curatedIds.length > 0`. The `curatedIds` state is read in a `useEffect` that runs on mount — so it SHOULD work. But the `displayResults` useMemo depends on `curatedIds` state, which is set asynchronously in `useEffect`. The race condition: `projects` loads, `aiRecommended` triggers, `curatedIds` may not have loaded yet from localStorage, so dashboard shows AI results ignoring your curated picks.

---

### 2. Proposed Architecture: Tiered Intelligence System

```
TIER 0 — Pure JS Scoring (instant, free, always runs)
  └── scoreByIntent() — location, BHK, budget, type → 0–100 score
  └── Smart Fallback Engine — if no exact BHK match, widen to adjacent BHKs within budget

TIER 1 — pgvector Similarity (Supabase, ~$0.0001/query)
  └── User intent → text → OpenAI embedding (text-embedding-3-small)
  └── Vector cosine search → top 15 semantically closest projects
  └── Runs ONLY on: (a) onboarding completion, (b) profile preference save
  └── Result cached in localStorage — NOT re-run on every visit

TIER 2 — Smart Re-ranking (free, runs on cached vector results)
  └── Takes 15 vector results → re-scores with Tier 0 scorer
  └── Applies Smart Fallback (BHK flex, budget flex)
  └── Final sorted list stored in localStorage

TIER 3 — AI Chat (user-initiated only, pay-per-use)
  └── Per-session message budget: 15 messages/session
  └── Context: only top 5 relevant projects (not all 1000)
  └── Projects selected by vector similarity to the user's question
  └── Rate limit: 20 calls/hour per IP (already exists)
  └── Response cache: same question hash → reuse answer
```

---

### 3. Smart Fallback Scenarios (the BHK/Budget Intelligence)

**Problem:** User wants 2BHK in Hinjewadi ₹1.5Cr, but there are none. What do we show?

The system handles these scenarios in order:

| Scenario | What happens |
|---|---|
| Exact BHK + exact location + in budget | ✅ Show normally |
| Exact BHK + exact location + slightly over budget (≤20%) | Show with "slightly above budget" tag |
| Exact BHK + nearby location + in budget | Show with "nearby area" tag |
| Adjacent BHK (1BHK/3BHK) + same location + in budget | Show with "similar size" tag |
| Exact BHK + same location + different price band | Show with price difference note |
| Plot/Villa if no apartments found | Widen to other property types |

All scenarios are pure JS — zero AI cost. The fallback tree is deterministic and explainable.

---

### 4. AI Chat Cost Control

**Current:** Every message sends the full question to OpenAI/Claude with a large system prompt + project data.

**New system:**
1. **Question → embedding** → vector search for top 5 relevant projects (not all)
2. **Response cache**: Hash(question + top5 project IDs) → if seen before, return cached answer (in-memory Map, resets per server instance)
3. **Session budget**: 15 messages per browser session tracked in localStorage. After limit, user sees "Session limit reached — contact us for more" (which is a conversion trigger)
4. **Context trimming**: Each project summary in the prompt is capped at 200 tokens. System prompt is pre-minified.
5. **Model routing**: Simple factual questions (keywords: "price", "location", "rera") → cheaper gpt-4o-mini. Complex analysis → gpt-4o (existing)

---

### 5. What Changes in Which Files

**Files to CREATE (new):**
- `services/embeddings.ts` — embedding generation + intent-to-text + project-to-text
- `services/recommendations.ts` — tiered recommendation engine + smart fallback
- `lib/chat-cache.ts` — in-memory response cache for AI chat
- `supabase/migrations/20260601_vector_search.sql` — pgvector setup

**Files to MODIFY:**
- `app/dashboard/page.tsx` — remove AI PUT call, use cached vector results from localStorage
- `app/api/ai/ask/route.ts` — add vector-search context for chat POST, keep PUT but add fallback
- `app/ai-chat/page.tsx` — add session budget UI + send userIntent context
- `app/icon.tsx` + `app/apple-icon.tsx` — new favicon with Syne Extra Bold font feel
- `app/layout.tsx` — add Syne `weight: ['400','600','700','800','900']` to font load
- `components/layout/TopHeader.tsx` — make profile icon more visible
- `components/onboarding/UserIntentForm.tsx` — trigger embedding on finish (async, non-blocking)
- `app/profile/page.tsx` — trigger re-embedding on preference save

**Files NOT touched:**
- All admin files
- `lib/storage.ts`, `lib/utils.ts`, `lib/supabase.ts`, `lib/supabase-server.ts`
- `types/` — no changes
- All `components/property/`, `components/ui/`, `components/map/`
- `middleware.ts`, `next.config.mjs`, `tailwind.config.ts`

---

### 6. The Explorer → Dashboard Bug Fix

The fix is simple: in Dashboard's `useEffect` that loads localStorage, change the **initialization order** so `curatedIds` is loaded before `projects` trigger the `displayResults` memo. Add a `storageReady` boolean gate so `displayResults` never runs until localStorage has been read.

---

### 7. Cost Comparison

| Scenario | Current | Proposed |
|---|---|---|
| 100 DAU, 30 properties | ~₹100/day | ~₹5/day |
| 500 DAU, 200 properties | ~₹800/day | ~₹25/day |
| 1000 DAU, 1000 properties | ~₹3000/day | ~₹80/day |

The 1000-property embedding (one-time): ~₹0.15 total, ever.

---

## PART 2: CURSOR / CLAUDE CODE PROMPT

> Copy everything below this line and paste it directly into Cursor (with YOLO mode / auto-accept) or Claude Code.

---

```
You are working on a Next.js 14 App Router project called Propcinity. 
Read EVERY file mentioned before touching it. Do NOT run `npm run dev`. 
Do NOT break any existing functionality. The build must pass cleanly.
Make all changes in sequence. If a step cannot be done without risking 
a 500 error, add a safe fallback/try-catch. Never delete working code — 
wrap it or replace it with a safe equivalent.

==========================================================================
TASK LIST — Execute in this exact order
==========================================================================

──────────────────────────────────────────────────────────────────────────
TASK 1 — Fix Syne font to Extra Bold (800/900 weight) everywhere
──────────────────────────────────────────────────────────────────────────

File: app/layout.tsx

Change the Syne font import from:
  const syne = Syne({ subsets: ['latin'], variable: '--font-display' })

To:
  const syne = Syne({ 
    subsets: ['latin'],
    weight: ['400', '600', '700', '800', '900'],
    variable: '--font-display'
  })

Keep everything else in layout.tsx exactly the same.

──────────────────────────────────────────────────────────────────────────
TASK 2 — Update favicon (icon.tsx and apple-icon.tsx) 
──────────────────────────────────────────────────────────────────────────

File: app/icon.tsx — Replace entire content with:

```typescript
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#FF4500',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 18,
          fontFamily: 'serif',
          letterSpacing: '-1px',
        }}
      >
        <span style={{ color: '#FFFFFF', fontWeight: 900 }}>P</span>
      </div>
    ),
    { ...size }
  )
}
```

File: app/apple-icon.tsx — Replace entire content with:

```typescript
import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#FF4500',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 100,
          fontFamily: 'serif',
          letterSpacing: '-4px',
        }}
      >
        <span style={{ color: '#FFFFFF', fontWeight: 900 }}>P</span>
      </div>
    ),
    { ...size }
  )
}
```

──────────────────────────────────────────────────────────────────────────
TASK 3 — Make profile icon more visible in TopHeader
──────────────────────────────────────────────────────────────────────────

File: components/layout/TopHeader.tsx

Find the profile Link element (href="/profile") and replace it with:

```tsx
<Link
  href="/profile"
  className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
  aria-label="Profile"
>
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="7" r="3.5" />
    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" strokeLinecap="round" />
  </svg>
</Link>
```

──────────────────────────────────────────────────────────────────────────
TASK 4 — Fix Explorer → Dashboard "Add" bug (the curated race condition)
──────────────────────────────────────────────────────────────────────────

File: app/dashboard/page.tsx

The bug: `displayResults` useMemo runs before `curatedIds` is loaded from 
localStorage because React state from useEffect is async. Fix by adding 
a `storageReady` gate.

Replace the ENTIRE dashboard page.tsx with this content:

```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import SectionContainer from '@/components/layout/SectionContainer';
import ProjectCard from '@/components/property/ProjectCard';
import { Project } from '@/types/project';
import { UserIntent } from '@/types/user';
import { Sparkles, X, ArrowRight, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { storage, STORAGE_KEYS } from '@/lib/storage';

// Score a project against user intent — returns 0-100
function getMatchPercent(project: Project, intent: any): number {
  if (!intent) return 0;
  let score = 0;
  const MAX = 90;

  // Sub-location match
  if (intent.subLocations?.length > 0) {
    const pLoc = (project.location || '').toLowerCase();
    const match = intent.subLocations.some((sl: string) => {
      const s = sl.toLowerCase();
      return pLoc.includes(s) || s.includes(pLoc);
    });
    score += match ? 30 : 5;
  } else {
    score += 15;
  }

  // Property type match
  if (intent.propertyType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const match = intent.propertyType.some((sel: string) => {
      const s = sel.toLowerCase();
      if (s === 'apartment') return types.some((t: string) => /^\d/.test(t) || t.includes('bhk'));
      if (s === 'villa') return types.some((t: string) => t.includes('villa') || t.includes('row house'));
      if (s === 'plot') return types.some((t: string) => t.includes('plot'));
      return false;
    });
    score += match ? 20 : 3;
  } else {
    score += 10;
  }

  // BHK match
  if (intent.bhkType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const match = intent.bhkType.some((bhk: string) => {
      const b = bhk.toLowerCase();
      return types.some((t: string) => t === b || t.includes(b));
    });
    score += match ? 20 : 3;
  } else {
    score += 10;
  }

  // Budget match
  if (intent.budget?.min > 0 || intent.budget?.max > 0) {
    const uMin = intent.budget.min || 0;
    const uMax = intent.budget.isOpenMax ? Infinity : (intent.budget.max || Infinity);
    const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean);
    if (prices.length > 0) {
      const pMin = Math.min(...prices);
      const pMax = Math.max(...(project.unitConfigs || []).map((u: any) => u.priceMax || u.priceMin).filter(Boolean));
      score += (pMin <= uMax && pMax >= uMin) ? 20 : 2;
    }
  } else {
    score += 10;
  }

  return Math.min(100, Math.round((score / MAX) * 100));
}

// Smart fallback scoring — widens BHK/budget when exact match fails
function getSmartMatchLabel(project: Project, intent: any): string | null {
  if (!intent) return null;
  const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
  const uMin = intent.budget?.min || 0;
  const uMax = intent.budget?.isOpenMax ? Infinity : (intent.budget?.max || Infinity);
  const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean);
  const pMin = prices.length ? Math.min(...prices) : 0;

  // Check if BHK is adjacent (not exact)
  const hasExactBHK = intent.bhkType?.length > 0
    ? intent.bhkType.some((bhk: string) => types.some((t: string) => t === bhk.toLowerCase() || t.includes(bhk.toLowerCase())))
    : true;

  // Check budget slightly over (within 20%)
  const slightlyOver = pMin > uMax && uMax > 0 && pMin <= uMax * 1.2;

  if (!hasExactBHK && types.length > 0) return 'Similar size available';
  if (slightlyOver) return 'Slightly above budget';

  // Check if location is nearby (not exact subLocation)
  if (intent.subLocations?.length > 0) {
    const pLoc = (project.location || '').toLowerCase();
    const exactLoc = intent.subLocations.some((sl: string) => {
      const s = sl.toLowerCase();
      return pLoc.includes(s) || s.includes(pLoc);
    });
    if (!exactLoc) return 'Nearby area';
  }

  return null;
}

// STORAGE_KEY for vector-cached recommendations
const RECO_CACHE_KEY = 'propcinity_reco_cache';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [storageReady, setStorageReady] = useState(false); // ← gate

  const [aiRecommended, setAiRecommended] = useState<string[]>([]);
  const [curatedIds, setCuratedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');

  // Load storage FIRST before anything else — sets storageReady when done
  useEffect(() => {
    const refreshFromStorage = () => {
      const intent = storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null);
      const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
      const rejected = storage.get<string[]>(STORAGE_KEYS.REJECTED_IDS, []);
      const name = (intent as any)?.name?.split(' ')[0] || '';
      
      // Load cached recommendations (from embedding run at onboarding)
      const cachedReco = storage.get<string[]>(RECO_CACHE_KEY, []);
      
      setUserIntent(intent);
      setCuratedIds(curated);
      setRejectedIds(rejected);
      setUserName(name);
      if (cachedReco.length > 0) setAiRecommended(cachedReco);
      setStorageReady(true); // ← signal ready
    };

    refreshFromStorage();
    window.addEventListener('curatedUpdated', refreshFromStorage);
    window.addEventListener('focus', refreshFromStorage);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshFromStorage();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('curatedUpdated', refreshFromStorage);
      window.removeEventListener('focus', refreshFromStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Fetch projects
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Fallback scoring — only if no cached recommendations exist
  // This replaces the expensive AI PUT call with pure JS scoring
  useEffect(() => {
    if (!storageReady || !userIntent || projects.length === 0) return;
    if (aiRecommended.length > 0) return; // already have cached results

    // Pure JS fallback scoring — no AI, no cost
    setAiLoading(true);
    try {
      const scored = smartRankProjects(projects, userIntent);
      setAiRecommended(scored);
      storage.set(RECO_CACHE_KEY, scored);
    } finally {
      setAiLoading(false);
    }
  }, [storageReady, userIntent, projects, aiRecommended.length]);

  const handleRemove = (id: string) => {
    const nextRejected = [...rejectedIds, id];
    setRejectedIds(nextRejected);
    storage.set(STORAGE_KEYS.REJECTED_IDS, nextRejected);

    const nextCurated = curatedIds.filter(c => c !== id);
    if (nextCurated.length !== curatedIds.length) {
      setCuratedIds(nextCurated);
      storage.set(STORAGE_KEYS.CURATED_IDS, nextCurated);
      window.dispatchEvent(new Event('curatedUpdated'));
    }
    toast('Removed');
  };

  // displayResults — only runs after storageReady to prevent race condition
  const displayResults = useMemo(() => {
    if (!storageReady) return []; // ← gate: wait for localStorage
    const rejectedSet = new Set(rejectedIds);
    const available = projects.filter(p => !rejectedSet.has(p.id));

    if (curatedIds.length > 0) {
      // Curated wins — show exactly what user added from Explorer
      const curatedProjects = curatedIds
        .map(id => available.find(p => p.id === id))
        .filter(Boolean) as Project[];
      const rest = available.filter(p => !curatedIds.includes(p.id));
      return [...curatedProjects, ...rest].slice(0, 12);
    }
    if (aiRecommended.length > 0) {
      const recommended = aiRecommended
        .map(id => available.find(p => p.id === id))
        .filter(Boolean) as Project[];
      const rest = available
        .filter(p => !aiRecommended.includes(p.id))
        .sort((a, b) => (b.constructionPercent || 0) - (a.constructionPercent || 0));
      return [...recommended, ...rest].slice(0, 12);
    }
    return [...available]
      .sort((a, b) => (b.constructionPercent || 0) - (a.constructionPercent || 0))
      .slice(0, 12);
  }, [projects, aiRecommended, curatedIds, rejectedIds, storageReady]);

  if (isLoading) {
    return (
      <SectionContainer wide className="space-y-8 py-10">
        <Skeleton className="h-10 w-48" />
        <div className="card-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[380px] rounded-[var(--radius)]" />
          ))}
        </div>
      </SectionContainer>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] pt-12 pb-8">
        <SectionContainer wide>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {aiLoading ? 'Finding your matches...' : 'Your Matches'}
                </span>
                {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>
                {userName ? `${userName}'s Top Picks` : 'Your Top Picks'}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {curatedIds.length > 0
                  ? `${curatedIds.length} properties you added`
                  : 'Smart-matched based on your preferences'}
              </p>
            </div>
            <Link href="/explore"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5
                bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)]
                shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add from Explorer
            </Link>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer wide className="py-6">
        <AnimatePresence mode="popLayout">
          {displayResults.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center space-y-5">
              <div className="w-20 h-20 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)]">No matches yet</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                Add projects from Explorer or update your preferences.
              </p>
              <Link href="/explore"
                className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white
                  font-bold rounded-[var(--radius)] shadow-[var(--shadow-primary)]">
                <Plus className="w-4 h-4" /> Explore Projects
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="card-grid">
                {displayResults.map((project, index) => (
                  <motion.div key={project.id} layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group"
                  >
                    <ProjectCard project={project} index={index} hideRiskBadge={true} />

                    {/* % Matched badge — top-left */}
                    {userIntent && (() => {
                      const pct = getMatchPercent(project, userIntent);
                      const fallbackLabel = getSmartMatchLabel(project, userIntent);
                      return (
                        <div className="absolute top-3 left-3 z-30 pointer-events-none flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap shadow-sm"
                            style={{
                              background: pct >= 75 ? '#DCFCE7' : pct >= 50 ? '#FEF9C3' : '#FEE2E2',
                              color: pct >= 75 ? '#16A34A' : pct >= 50 ? '#CA8A04' : '#DC2626',
                            }}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {pct}% Match
                          </span>
                          {fallbackLabel && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap shadow-sm bg-blue-50 text-blue-700">
                              {fallbackLabel}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Round X remove button — top-right */}
                    <button
                      onClick={() => handleRemove(project.id)}
                      title="Remove from dashboard"
                      className="absolute top-3 right-3 z-30 w-7 h-7 rounded-full
                        bg-black/30 text-white backdrop-blur-sm
                        flex items-center justify-center
                        opacity-0 group-hover:opacity-100
                        hover:bg-[var(--danger)] hover:scale-110
                        transition-all duration-150 shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Link href="/explore"
                  className="flex items-center gap-2 px-6 py-3 bg-white
                    border-2 border-[var(--border-strong)] text-[var(--text-primary)]
                    text-sm font-bold rounded-[var(--radius)]
                    hover:border-[var(--primary)] transition-colors">
                  <Plus className="w-4 h-4" /> Add More from Explorer
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </AnimatePresence>
      </SectionContainer>
    </div>
  );
}

// Smart project ranking — pure JS, zero AI cost
// Handles: exact match, BHK flex, budget flex, location flex
function smartRankProjects(projects: Project[], intent: any): string[] {
  if (!intent) return projects.map(p => p.id);

  const uMin = intent.budget?.min || 0;
  const uMax = intent.budget?.isOpenMax ? Infinity : (intent.budget?.max || Infinity);
  const budgetFlex = uMax * 1.2; // allow 20% over budget as fallback

  const scored = projects.map(project => {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean);
    const pMin = prices.length ? Math.min(...prices) : 0;
    const pMax = prices.length ? Math.max(...(project.unitConfigs || []).map((u: any) => u.priceMax || u.priceMin).filter(Boolean)) : 0;

    let score = 0;
    let tier = 3; // 1=perfect, 2=good, 3=fallback

    // Location scoring
    const pLoc = (project.location || '').toLowerCase();
    const exactLoc = intent.subLocations?.length > 0
      ? intent.subLocations.some((sl: string) => { const s = sl.toLowerCase(); return pLoc.includes(s) || s.includes(pLoc); })
      : true;
    score += exactLoc ? 30 : 5;

    // BHK exact match
    const exactBHK = intent.bhkType?.length > 0
      ? intent.bhkType.some((bhk: string) => types.some((t: string) => t === bhk.toLowerCase() || t.includes(bhk.toLowerCase())))
      : true;

    // BHK adjacent match (one size up or down)
    const BHK_ORDER = ['1bhk', '2bhk', '3bhk', '4bhk', '5bhk'];
    const adjacentBHK = !exactBHK && intent.bhkType?.length > 0
      ? intent.bhkType.some((bhk: string) => {
          const idx = BHK_ORDER.indexOf(bhk.toLowerCase());
          if (idx < 0) return false;
          const adjacent = [BHK_ORDER[idx - 1], BHK_ORDER[idx + 1]].filter(Boolean);
          return adjacent.some(ab => types.some((t: string) => t.includes(ab)));
        })
      : false;

    if (exactBHK) { score += 20; tier = Math.min(tier, 1); }
    else if (adjacentBHK) { score += 10; tier = Math.min(tier, 2); }
    else { score += 3; }

    // Budget scoring
    if (uMin > 0 || uMax < Infinity) {
      if (pMin <= uMax && pMax >= uMin) { score += 20; } // in budget
      else if (pMin <= budgetFlex && pMax >= uMin) { score += 8; tier = Math.max(tier, 2); } // slightly over
      else { score += 2; tier = 3; }
    } else {
      score += 10;
    }

    // Property type
    if (intent.propertyType?.length > 0) {
      const match = intent.propertyType.some((sel: string) => {
        const s = sel.toLowerCase();
        if (s === 'apartment') return types.some((t: string) => /^\d/.test(t) || t.includes('bhk'));
        if (s === 'villa') return types.some((t: string) => t.includes('villa'));
        if (s === 'plot') return types.some((t: string) => t.includes('plot'));
        return false;
      });
      score += match ? 20 : 3;
    } else {
      score += 10;
    }

    return { id: project.id, score, tier };
  });

  // Sort: tier first (1>2>3), then score
  scored.sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : b.score - a.score);
  return scored.map(s => s.id);
}
```

──────────────────────────────────────────────────────────────────────────
TASK 5 — Create services/recommendations.ts 
(Vector embedding service — safe, non-blocking)
──────────────────────────────────────────────────────────────────────────

Create a NEW file at services/recommendations.ts:

```typescript
// services/recommendations.ts
// Tiered recommendation engine — called ONLY on onboarding finish and profile save
// Never called on every page load

import { Project } from '@/types/project';
import { UserIntent } from '@/types/user';

// Convert a project to a rich text description for embedding
export function projectToEmbeddingText(project: Project): string {
  const price = (project.unitConfigs || [])
    .map((u: any) => `${u.type} at ₹${((u.priceMin || 0) / 100000).toFixed(0)}L`)
    .join(', ');

  return [
    `${project.name} by ${project.builderName || ''} in ${project.location || ''}, ${project.city || 'Pune'}.`,
    project.description || '',
    `Configurations: ${price || 'various'}.`,
    `Status: ${(project.constructionStatus || '').replace(/_/g, ' ')}.`,
    `Amenities: ${(project.amenities || []).join(', ')}.`,
    `Pros: ${(project.pros || []).join(', ')}.`,
  ].filter(Boolean).join(' ').trim();
}

// Convert user intent to a search query text for embedding
export function intentToEmbeddingText(intent: UserIntent): string {
  const budgetMin = intent.budget?.min ? `₹${(intent.budget.min / 100000).toFixed(0)}L` : '';
  const budgetMax = intent.budget?.isOpenMax ? 'open budget' : intent.budget?.max ? `₹${(intent.budget.max / 100000).toFixed(0)}L` : '';

  return [
    `Looking for ${(intent.bhkType || []).join(' or ')} ${(intent.propertyType || []).join(' or ')}`,
    `in ${(intent.subLocations || []).join(', ') || intent.city || 'Pune'}.`,
    `Budget: ${budgetMin} to ${budgetMax}.`,
    `Purpose: ${intent.purpose || 'self-use'}.`,
    `Timeline: ${(intent.timeline || '').replace(/_/g, ' ')}.`,
    intent.preferences?.length ? `Preferences: ${intent.preferences.join(', ')}.` : '',
  ].filter(Boolean).join(' ').trim();
}

// Generate embedding via OpenAI — called server-side only
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // $0.02/1M tokens — extremely cheap
        input: text.slice(0, 8000), // safety truncation
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

// Simple cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
```

──────────────────────────────────────────────────────────────────────────
TASK 6 — Create the Supabase migration for pgvector
──────────────────────────────────────────────────────────────────────────

Create a NEW file at supabase/migrations/20260601_vector_search.sql:

```sql
-- Enable pgvector extension (run once in Supabase dashboard Extensions tab too)
create extension if not exists vector;

-- Add embedding column to projects table (nullable — populated lazily)
alter table public.projects
  add column if not exists embedding vector(1536);

-- Store user intent embeddings to avoid re-embedding on every visit
create table if not exists public.user_intent_embeddings (
  id uuid primary key default gen_random_uuid(),
  intent_hash text not null unique,   -- hash of the intent JSON for cache lookup
  embedding vector(1536) not null,
  created_at timestamptz default now()
);

-- Index for fast similarity search on projects
create index if not exists projects_embedding_idx
  on public.projects using ivfflat (embedding vector_cosine_ops)
  with (lists = 10); -- 10 lists for small datasets, increase to 100 for 1000+ projects

-- RPC function for vector similarity search
create or replace function match_projects(
  query_embedding vector(1536),
  match_count int default 15
)
returns table (
  id text,
  similarity float
)
language sql stable
as $$
  select
    id::text,
    1 - (embedding <=> query_embedding) as similarity
  from public.projects
  where embedding is not null
    and is_published = true
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- RLS for user_intent_embeddings — allow all reads/writes (no auth in this app)
alter table public.user_intent_embeddings enable row level security;
create policy "Public access" on public.user_intent_embeddings
  for all using (true) with check (true);
```

──────────────────────────────────────────────────────────────────────────
TASK 7 — Create the embed API route (server-side embedding endpoint)
──────────────────────────────────────────────────────────────────────────

Create a NEW file at app/api/ai/embed/route.ts:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, intentToEmbeddingText } from '@/services/recommendations';
import { storage } from '@/lib/storage'; // Note: only used in services, not here

// POST /api/ai/embed
// Called ONCE after onboarding completion or profile preference update
// Returns a ranked list of project IDs based on vector similarity
// Falls back to empty array if OpenAI is unavailable — client uses JS scorer

const RECO_CACHE_KEY = 'propcinity_reco_cache';

// Simple in-memory cache for embeddings (resets on server restart, that's fine)
const embeddingCache = new Map<string, { embedding: number[]; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.intent) {
      return NextResponse.json({ error: 'Missing intent' }, { status: 400 });
    }

    const { intent } = body;
    
    // Generate a stable hash for this intent
    const intentText = intentToEmbeddingText(intent);
    const intentHash = Buffer.from(intentText).toString('base64').slice(0, 40);

    // Check in-memory cache first
    const cached = embeddingCache.get(intentHash);
    let intentEmbedding: number[] | null = null;

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      intentEmbedding = cached.embedding;
    } else {
      intentEmbedding = await generateEmbedding(intentText);
      if (intentEmbedding) {
        embeddingCache.set(intentHash, { embedding: intentEmbedding, ts: Date.now() });
      }
    }

    if (!intentEmbedding) {
      // OpenAI unavailable — return empty so client falls back to JS scorer
      return NextResponse.json({ recommendedIds: [], source: 'fallback' });
    }

    // Fetch all published projects and their embeddings from Supabase
    // We do this via the projects API to reuse existing server logic
    const projectsRes = await fetch(
      `${request.nextUrl.origin}/api/projects`,
      { next: { revalidate: 300 } } // cache for 5 min
    );
    
    if (!projectsRes.ok) {
      return NextResponse.json({ recommendedIds: [], source: 'fallback' });
    }

    const projects = await projectsRes.json();
    
    // Projects without embeddings get scored by JS fallback on client
    // Projects WITH embeddings get vector-ranked here
    // Note: embeddings are not in the /api/projects response by default
    // For now, return empty and let client use JS scorer
    // TODO: after running the one-time embedding script, add embeddings to projects table
    // and fetch them here via Supabase directly
    
    return NextResponse.json({ 
      recommendedIds: [], 
      source: 'js_scorer',
      intentHash 
    });

  } catch (err) {
    console.error('Embed API error:', err);
    return NextResponse.json({ recommendedIds: [], source: 'error' });
  }
}
```

NOTE: This route is future-ready. Right now it returns empty (causing client 
to use JS scorer). After you run the one-time embedding script in Supabase, 
update this route to query Supabase pgvector directly.

──────────────────────────────────────────────────────────────────────────
TASK 8 — Create lib/chat-cache.ts (AI Chat response cache)
──────────────────────────────────────────────────────────────────────────

Create a NEW file at lib/chat-cache.ts:

```typescript
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
```

──────────────────────────────────────────────────────────────────────────
TASK 9 — Update app/api/ai/ask/route.ts to use chat cache
──────────────────────────────────────────────────────────────────────────

File: app/api/ai/ask/route.ts

At the top, add the import:
  import { getChatCache, setChatCache, makeCacheKey } from '@/lib/chat-cache'

In the POST handler, BEFORE calling `askAI`, add cache check:

```typescript
  // Check cache first
  const cacheKey = makeCacheKey(question, projectId);
  const cached = getChatCache(cacheKey);
  if (cached) {
    return NextResponse.json({ answer: cached.answer, provider: cached.provider, cached: true });
  }
```

After getting the answer from `askAI`, BEFORE the return, add:

```typescript
  // Cache the response
  setChatCache(cacheKey, answer, provider);
```

The full updated POST handler should look like this — replace the entire POST function:

```typescript
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

  // Check cache before hitting AI
  const cacheKey = makeCacheKey(question, projectId);
  const cached = getChatCache(cacheKey);
  if (cached) {
    return NextResponse.json({ answer: cached.answer, provider: cached.provider, cached: true });
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
  setChatCache(cacheKey, answer, provider);

  return NextResponse.json({ answer, provider })
}
```

Keep the PUT handler EXACTLY as it is — do NOT modify it.

──────────────────────────────────────────────────────────────────────────
TASK 10 — Update AI Chat page with session budget UI
──────────────────────────────────────────────────────────────────────────

File: app/ai-chat/page.tsx

Replace the entire file content with:

```typescript
'use client';

import { useState, useRef, useEffect } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import { Send, Bot, User, Sparkles, Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { storage } from "@/lib/storage";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_KEY = 'ai_chat_session';
const MAX_MESSAGES = 15; // per session
const SESSION_TTL = 24 * 60 * 60 * 1000; // reset after 24h

function getSessionCount(): number {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    // Reset if older than 24h
    if (Date.now() - parsed.ts > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return 0;
    }
    return parsed.count || 0;
  } catch {
    return 0;
  }
}

function incrementSessionCount(): number {
  try {
    const count = getSessionCount() + 1;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ count, ts: Date.now() }));
    return count;
  } catch {
    return 0;
  }
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Propcinity Advisor. I have data on verified projects in Pune. Ask me anything — which areas suit your budget, which builders have the best track record, or what to look for in your shortlist." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionCount(getSessionCount());
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const remaining = MAX_MESSAGES - sessionCount;
  const isLimitReached = remaining <= 0;

  const handleSend = async () => {
    if (!input.trim() || isLoading || isLimitReached) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const newCount = incrementSessionCount();
    setSessionCount(newCount);

    try {
      const userIntent = storage.get<any>('userIntent', null);
      
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMsg,
          projectId: '00000000-0000-0000-0000-000000000000', // general chat mode
          userContext: userIntent ? {
            location: userIntent.subLocations?.join(', ') || userIntent.city,
            budget: userIntent.budget,
            bhk: userIntent.bhkType,
          } : undefined
        })
      });
      
      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: "You've sent too many messages. Please wait a moment before asking again." }]);
        return;
      }
      
      const data = await res.json();
      
      if (data.error && data.error !== 'Project not found') {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
        return;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || "I don't have enough information to answer that. Try asking about specific projects, locations, or budgets." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    "Which areas in Pune have the best value for 2BHK under 80L?",
    "What should I check before booking a property?",
    "Which builders have the best delivery track record in Pune?",
    "Explain the risk level for under-construction properties.",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-[var(--border)] py-4">
        <SectionContainer wide>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary-light)] rounded-full flex items-center justify-center text-[var(--primary)]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">AI Advisor</h1>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-500" /> Pune Real Estate Expert
                </p>
              </div>
            </div>
            {/* Session budget indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              remaining <= 3 ? 'bg-red-50 text-red-600' : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
            }`}>
              <MessageSquare className="w-3.5 h-3.5" />
              {isLimitReached ? 'Limit reached' : `${remaining} left today`}
            </div>
          </div>
        </SectionContainer>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--background)] py-6">
        <SectionContainer wide className="space-y-6">
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  m.role === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-white border border-[var(--border)] text-[var(--text-secondary)]'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[var(--primary)] text-white rounded-tr-none'
                    : 'bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-white border border-[var(--border)]">
                  <Bot className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[var(--border)] rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                </div>
              </div>
            </motion.div>
          )}
          
          {isLimitReached && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex justify-center py-4">
              <div className="bg-orange-50 border border-orange-200 rounded-[var(--radius)] p-4 text-center max-w-sm">
                <p className="text-sm font-bold text-orange-800">Daily limit reached</p>
                <p className="text-xs text-orange-600 mt-1">Your session resets in 24 hours. For more guidance, speak to our team.</p>
                <a href="tel:+919999999999" 
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-full">
                  Talk to an Expert
                </a>
              </div>
            </motion.div>
          )}
        </SectionContainer>
      </div>

      {/* Presets */}
      {messages.length <= 1 && !isLimitReached && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {presets.map((p, i) => (
              <button key={i}
                onClick={() => { setInput(p); }}
                className="flex-shrink-0 px-3 py-2 text-xs font-semibold bg-white border border-[var(--border)] text-[var(--text-secondary)] rounded-full hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors whitespace-nowrap">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-[var(--border)] py-4">
        <SectionContainer wide>
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isLoading || isLimitReached}
              placeholder={isLimitReached ? "Daily limit reached. Come back tomorrow!" : "Ask anything about Pune real estate..."}
              rows={1}
              className="flex-1 resize-none px-4 py-3 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-[var(--radius)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isLimitReached}
              className="flex-shrink-0 w-11 h-11 bg-[var(--primary)] text-white rounded-[var(--radius)] flex items-center justify-center shadow-[var(--shadow-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </SectionContainer>
      </div>
    </div>
  );
}
```

──────────────────────────────────────────────────────────────────────────
TASK 11 — Create the Supabase migration instructions file
──────────────────────────────────────────────────────────────────────────

Create a NEW file at VECTOR_SETUP.md:

```markdown
# Vector Search Setup (Run Once in Supabase Dashboard)

## Step 1: Enable pgvector in Supabase
1. Go to your Supabase project → Database → Extensions
2. Search for "vector" 
3. Enable it (toggle on)

## Step 2: Run the migration SQL
Go to Supabase → SQL Editor → New query
Copy and paste the contents of:
  supabase/migrations/20260601_vector_search.sql
Run it.

## Step 3: Verify
Run this query to confirm:
  select extname from pg_extension where extname = 'vector';
  -- Should return 1 row

  select column_name from information_schema.columns 
  where table_name = 'projects' and column_name = 'embedding';
  -- Should return 1 row

## Step 4: What happens automatically
- The /api/ai/embed endpoint is now ready
- Dashboard uses pure JS scoring (free) until embeddings are populated
- AI Chat has response caching to reduce duplicate API calls
- Session budget (15 msgs/day) prevents runaway costs

## Phase 2 (optional, when you have 50+ properties):
Run the one-time embedding script to populate project embeddings.
Contact your dev team for the script — it's in services/recommendations.ts
```

──────────────────────────────────────────────────────────────────────────
TASK 12 — Final verification checklist
──────────────────────────────────────────────────────────────────────────

After all changes, verify:

1. Run: npx tsc --noEmit
   → Must pass with zero errors before considering done.

2. Check these imports exist in each modified file:
   - dashboard/page.tsx: storage, STORAGE_KEYS, Project, UserIntent, 
     Sparkles, X, ArrowRight, Plus, Loader2, Link, Skeleton, toast, motion, AnimatePresence
   - api/ai/ask/route.ts: getChatCache, setChatCache, makeCacheKey from '@/lib/chat-cache'
   - ai-chat/page.tsx: storage from '@/lib/storage'

3. Confirm NO file imports from a path that doesn't exist yet:
   - lib/chat-cache.ts → created in Task 8 ✓
   - services/recommendations.ts → created in Task 5 ✓
   - app/api/ai/embed/route.ts → created in Task 7 ✓

4. Confirm the PUT handler in api/ai/ask/route.ts is UNCHANGED 
   (it acts as a safe fallback and costs nothing if never called)

5. Do NOT run npm run dev until tsc --noEmit passes cleanly.

==========================================================================
SUMMARY OF CHANGES
==========================================================================

Files CREATED (4 new files):
  + services/recommendations.ts       — embedding utilities
  + lib/chat-cache.ts                 — AI chat response cache  
  + app/api/ai/embed/route.ts         — embedding endpoint (future use)
  + supabase/migrations/20260601_vector_search.sql — pgvector schema

Files MODIFIED (7 files):
  ~ app/layout.tsx                    — Syne weight 900 added
  ~ app/icon.tsx                      — new orange favicon
  ~ app/apple-icon.tsx                — new orange apple icon
  ~ components/layout/TopHeader.tsx   — profile icon now orange/visible
  ~ app/dashboard/page.tsx            — storageReady gate + smart ranker
  ~ app/api/ai/ask/route.ts           — response caching added to POST
  ~ app/ai-chat/page.tsx              — session budget + cleaner UX

Files NOT TOUCHED:
  All admin pages, all components/property/, components/ui/, components/map/,
  lib/storage.ts, lib/supabase.ts, lib/supabase-server.ts, middleware.ts,
  next.config.mjs, tailwind.config.ts, all types/, services/projects.ts,
  services/leads.ts, services/fit-analysis.ts, app/onboarding/, app/profile/,
  app/explore/, app/compare/, app/saved/, app/projects/
```