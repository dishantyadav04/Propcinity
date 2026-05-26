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

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // All localStorage state — initialised to empty, loaded in useEffect
  const [aiRecommended, setAiRecommended] = useState<string[]>([]);
  const [curatedIds, setCuratedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');

  // Load all localStorage values once on mount (client-only)
  useEffect(() => {
    const intent = storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null);
    const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
    const rejected = storage.get<string[]>(STORAGE_KEYS.REJECTED_IDS, []);
    const name = (intent as any)?.name?.split(' ')[0] || '';

    setUserIntent(intent);
    setCuratedIds(curated);
    setRejectedIds(rejected);
    setUserName(name);
  }, []);

  // Listen for curated updates from other pages
  useEffect(() => {
    const handler = () => {
      setCuratedIds(storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []));
    };
    window.addEventListener('curatedUpdated', handler);
    return () => window.removeEventListener('curatedUpdated', handler);
  }, []);

  // Fetch projects
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // AI recommendations — only after projects + intent are loaded
  useEffect(() => {
    if (!userIntent || projects.length === 0) return;
    setAiLoading(true);
    fetch('/api/ai/ask', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIntent, projects }),
    })
      .then(r => r.json())
      .then(data => setAiRecommended(data.recommended || []))
      .catch(() => {
        // Fallback: sort by construction progress
        const sorted = [...projects]
          .sort((a, b) => (b.constructionPercent || 0) - (a.constructionPercent || 0))
          .map(p => p.id);
        setAiRecommended(sorted);
      })
      .finally(() => setAiLoading(false));
  }, [userIntent, projects]);

  const handleRemove = (id: string) => {
    // Add to rejected
    const nextRejected = [...rejectedIds, id];
    setRejectedIds(nextRejected);
    storage.set(STORAGE_KEYS.REJECTED_IDS, nextRejected);

    // Remove from curated if present
    const nextCurated = curatedIds.filter(c => c !== id);
    if (nextCurated.length !== curatedIds.length) {
      setCuratedIds(nextCurated);
      storage.set(STORAGE_KEYS.CURATED_IDS, nextCurated);
      window.dispatchEvent(new Event('curatedUpdated'));
    }
    toast('Removed');
  };

  const displayResults = useMemo(() => {
    const rejectedSet = new Set(rejectedIds);
    const available = projects.filter(p => !rejectedSet.has(p.id));

    if (curatedIds.length > 0) {
      return available.filter(p => curatedIds.includes(p.id));
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
  }, [projects, aiRecommended, curatedIds, rejectedIds]);

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
                  {aiLoading ? 'AI is finding your matches...' : 'Your Matches'}
                </span>
                {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>
                {userName ? `${userName}'s Top Picks` : 'Your Top Picks'}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {curatedIds.length > 0
                  ? `${displayResults.length} properties you added`
                  : 'AI-curated based on your preferences'}
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

                    {/* Risk pill (normal) → Remove pill (hover) — same size */}
                    <div className="absolute top-3 left-3 z-30" style={{ height: '22px' }}>
                      <span className={`
                        absolute inset-0 inline-flex items-center justify-center
                        px-2.5 text-[10px] font-bold rounded-full whitespace-nowrap
                        transition-all duration-150
                        group-hover:opacity-0 group-hover:pointer-events-none
                      `} style={{
                        background: (project as any).riskLabel === 'low'
                          ? 'var(--success-light)' : (project as any).riskLabel === 'medium'
                          ? 'var(--warning-light)' : 'var(--danger-light)',
                        color: (project as any).riskLabel === 'low'
                          ? 'var(--success)' : (project as any).riskLabel === 'medium'
                          ? 'var(--warning)' : 'var(--danger)',
                      }}>
                        {(project as any).riskLabel === 'low' ? 'Low Risk'
                          : (project as any).riskLabel === 'medium' ? 'Med Risk' : 'High Risk'}
                      </span>
                      <button
                        onClick={() => handleRemove(project.id)}
                        className="absolute inset-0 inline-flex items-center justify-center gap-1
                          px-2.5 text-[10px] font-bold rounded-full whitespace-nowrap
                          bg-[var(--danger)] text-white
                          opacity-0 pointer-events-none
                          group-hover:opacity-100 group-hover:pointer-events-auto
                          transition-all duration-150 hover:brightness-90"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
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
