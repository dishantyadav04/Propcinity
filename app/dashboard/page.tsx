'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SectionContainer from '@/components/layout/SectionContainer';
import ProjectCard from '@/components/property/ProjectCard';
import { Project } from '@/types/project';
import { UserIntent } from '@/types/user';
import { Sparkles, X, ArrowRight, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getMatchPercent } from '@/lib/match-score';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useGuestMode } from '@/hooks/useGuestMode';

function getSmartMatchLabel(project: Project, intent: any): string | null {
  if (!intent) return null;
  const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
  const uMax = intent.budget?.isOpenMax ? Infinity : (intent.budget?.max || Infinity);
  const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean);
  const pMin = prices.length ? Math.min(...prices) : 0;

  const hasExactBHK = intent.bhkType?.length > 0
    ? intent.bhkType.some((bhk: string) =>
        types.some((t: string) => t === bhk.toLowerCase() || t.includes(bhk.toLowerCase()))
      )
    : true;

  const slightlyOver = pMin > uMax && uMax > 0 && pMin <= uMax * 1.2;

  if (!hasExactBHK && types.length > 0) {
    const rawTypes = (project.unitConfigs || []).map((u: any) => u.type).filter(Boolean);
    const uniqueTypes = Array.from(new Set(rawTypes));
    if (uniqueTypes.length > 0) {
      let formattedTypes = '';
      if (uniqueTypes.length === 1) {
        formattedTypes = uniqueTypes[0];
      } else if (uniqueTypes.length === 2) {
        formattedTypes = uniqueTypes.join(' & ');
      } else {
        formattedTypes = uniqueTypes.slice(0, -1).join(', ') + ' & ' + uniqueTypes[uniqueTypes.length - 1];
      }
      return `${formattedTypes} available`;
    }
    return 'Alternative size available';
  }
  if (slightlyOver) return 'Slightly above budget';

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

function smartRankProjects(projects: Project[], intent: any): string[] {
  if (!intent) return projects.map(p => p.id);

  const uMin = intent.budget?.min || 0;
  const uMax = intent.budget?.isOpenMax ? Infinity : (intent.budget?.max || Infinity);
  const budgetFlex = uMax === Infinity ? Infinity : uMax * 1.2;

  const scored = projects.map(project => {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean);
    const pMin = prices.length ? Math.min(...prices) : 0;
    const pMax = prices.length
      ? Math.max(...(project.unitConfigs || []).map((u: any) => u.priceMax || u.priceMin).filter(Boolean))
      : 0;

    let score = 0;
    let tier = 3;

    const pLoc = (project.location || '').toLowerCase();
    const exactLoc = intent.subLocations?.length > 0
      ? intent.subLocations.some((sl: string) => {
          const s = sl.toLowerCase();
          return pLoc.includes(s) || s.includes(pLoc);
        })
      : true;
    score += exactLoc ? 30 : 5;

    const exactBHK = intent.bhkType?.length > 0
      ? intent.bhkType.some((bhk: string) =>
          types.some((t: string) => t === bhk.toLowerCase() || t.includes(bhk.toLowerCase()))
        )
      : true;

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

    if (uMin > 0 || uMax < Infinity) {
      if (pMin <= uMax && pMax >= uMin) { score += 20; }
      else if (pMin <= budgetFlex && pMax >= uMin) { score += 8; tier = Math.max(tier, 2); }
      else { score += 2; tier = 3; }
    } else {
      score += 10;
    }

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

  scored.sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : b.score - a.score);
  return scored.map(s => s.id);
}

const RECO_CACHE_KEY = 'propcinity_reco_cache';

export default function DashboardPage() {
  const router = useRouter();
  const { isGuest } = useGuestMode();

  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const [aiRecommended, setAiRecommended] = useState<string[]>([]);
  const [curatedIds, setCuratedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (isGuest) router.replace('/onboarding');
  }, [isGuest, router]);

  useEffect(() => {
    const loadFromStorage = () => {
      const intent = storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null);
      const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
      const rejected = storage.get<string[]>(STORAGE_KEYS.REJECTED_IDS, []);
      const name = (intent as any)?.name?.split(' ')[0] || '';
      const cachedReco = storage.get<string[]>(RECO_CACHE_KEY, []);

      setUserIntent(intent);
      setCuratedIds(curated);
      setRejectedIds(rejected);
      setUserName(name);
      if (cachedReco.length > 0) setAiRecommended(cachedReco);
      setStorageReady(true);
    };

    loadFromStorage();

    const handleCuratedUpdate = () => {
      const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
      setCuratedIds(curated);
    };

    const handleFocus = () => loadFromStorage();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadFromStorage();
    };

    window.addEventListener('curatedUpdated', handleCuratedUpdate);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('curatedUpdated', handleCuratedUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!storageReady || !userIntent || projects.length === 0) return;
    if (aiRecommended.length > 0) return;

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

  const displayResults = useMemo(() => {
    if (!storageReady) return [];
    if (curatedIds.length > 0 && projects.length === 0) return [];

    const rejectedSet = new Set(rejectedIds);
    const available = projects.filter(p => !rejectedSet.has(p.id));

    if (curatedIds.length > 0) {
      const curatedProjects = curatedIds
        .map(id => available.find(p => p.id === id))
        .filter((p): p is Project => p !== undefined);
      return curatedProjects;
    }

    if (aiRecommended.length > 0) {
      const recommended = aiRecommended
        .map(id => available.find(p => p.id === id))
        .filter((p): p is Project => p !== undefined);
      const rest = available
        .filter(p => !aiRecommended.includes(p.id))
        .sort((a, b) => (b.constructionPercent || 0) - (a.constructionPercent || 0));
      return [...recommended, ...rest].slice(0, 12);
    }

    return [...available]
      .sort((a, b) => (b.constructionPercent || 0) - (a.constructionPercent || 0))
      .slice(0, 12);
  }, [projects, aiRecommended, curatedIds, rejectedIds, storageReady]);

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showSkeleton =
    isLoading ||
    !storageReady ||
    (curatedIds.length > 0 && projects.length === 0);

  if (showSkeleton) {
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
      <div className="bg-white border-b border-[var(--border)] pt-12 pb-8">
        <SectionContainer wide>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Finding your matches...' : 'Your Matches'}</span>
                {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>
                {userName ? `${userName}'s Top Picks` : 'Your Top Picks'}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {curatedIds.length > 0
                  ? `${curatedIds.length} propert${curatedIds.length === 1 ? 'y' : 'ies'} you added`
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

                    <button
                      onClick={() => handleRemove(project.id)}
                      title="Remove from dashboard"
                      className="absolute top-3 left-3 z-30 w-7 h-7 rounded-full
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
