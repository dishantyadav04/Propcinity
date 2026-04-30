'use client';

import { useEffect, useState, useMemo } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import ProjectCard from "@/components/property/ProjectCard";
import { Project } from "@/types/project";
import { UserIntent } from "@/types/user";
import { Search, Sparkles, X, ArrowRight, Plus, Target, Info } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { prismMatch, PRISMResult } from '@/lib/prism'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [curatedIds, setCuratedIds] = useState<string[]>([]);

  useEffect(() => {
    const savedIntent = localStorage.getItem('userIntent');
    if (savedIntent) setUserIntent(JSON.parse(savedIntent));

    const saved = JSON.parse(localStorage.getItem('curatedIds') || '[]');
    setCuratedIds(saved);

    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => {
      const ids = JSON.parse(localStorage.getItem('curatedIds') || '[]');
      setCuratedIds(ids);
    };
    window.addEventListener('curatedUpdated', handler);
    return () => window.removeEventListener('curatedUpdated', handler);
  }, []);

  const prismResults = useMemo((): PRISMResult[] => {
    if (!userIntent || projects.length === 0) return []

    const buyer = {
      city: (userIntent as any).city || userIntent.location || 'Pune',
      subLocations: (userIntent as any).subLocations || [],
      purpose: userIntent.purpose,
      propertyType: userIntent.propertyType || [],
      bhkType: (userIntent as any).bhkType || [],
      budget: userIntent.budget,
      timeline: userIntent.timeline,
      preferences: (userIntent as any).preferences || [],
      rejectedIds: [],
    }

    return prismMatch(projects, buyer)
  }, [projects, userIntent])

  const displayResults = useMemo(() => {
    if (curatedIds.length > 0) {
      const curated = prismResults
        .filter(r => curatedIds.includes(r.project.id))
        .sort((a, b) => b.totalScore - a.totalScore)
      const others = prismResults
        .filter(r => !curatedIds.includes(r.project.id))
        .sort((a, b) => b.totalScore - a.totalScore)
      return [...curated, ...others].slice(0, 12)
    }
    // Always sort by totalScore descending
    return [...prismResults]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 12)
  }, [prismResults, curatedIds])

  const removeFromCurated = (id: string) => {
    const next = curatedIds.filter(cid => cid !== id);
    setCuratedIds(next);
    localStorage.setItem('curatedIds', JSON.stringify(next));
    window.dispatchEvent(new Event('curatedUpdated'));
    toast('Removed from shortlist');
  };

  if (isLoading) {
    return (
      <SectionContainer wide className="space-y-8 py-10">
        <Skeleton className="h-10 w-48" />
        <div className="card-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[380px] rounded-[var(--radius)]" />)}
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
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                AI-Powered Analysis
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                Welcome back, {userIntent?.name?.split(' ')[0] || 'Buyer'}
              </h1>
              <p className="text-[var(--text-secondary)] max-w-xl font-medium">
                We've analyzed 50+ projects against your {userIntent?.city || userIntent?.location} preferences. 
                Here are your best matches.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/onboarding" className="px-5 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--surface)] transition-colors">
                Edit Preferences
              </Link>
              <Link href="/explore" className="px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity flex items-center gap-2">
                <Search className="w-4 h-4" /> Explore All
              </Link>
            </div>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer wide className="py-12 space-y-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayResults.map((result, i) => (
            <div key={result.project.id} className="relative group">
              <ProjectCard project={result.project} index={i} prismResult={result} />

              {/* Match % badge — top right of image, above trust score */}
              {result.totalScore >= 25 && (
                <div className="absolute top-3 right-3 z-20 pointer-events-none">
                  <div className={`
                    px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-sm
                    ${result.tier === 'precision'
                      ? 'bg-[var(--success)]'
                      : result.tier === 'value'
                        ? 'bg-[var(--primary)]'
                        : 'bg-[var(--warning)]'
                    }
                  `}>
                    {result.totalScore}% match
                  </div>
                </div>
              )}

              {/* Remove button — appears where risk badge is (top-left),
                  visible on hover, matches risk badge pill styling */}
              <button
                onClick={() => removeFromCurated(result.project.id)}
                title="Remove from dashboard"
                className="
                  absolute top-3 left-3 z-30
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                "
              >
                <div className="
                  flex items-center gap-1 px-2 py-1
                  bg-[var(--danger)] text-white
                  text-[10px] font-bold rounded-full
                  shadow-sm hover:scale-105 hover:shadow-md
                  transition-all duration-150
                ">
                  <X className="w-3 h-3" />
                  Remove
                </div>
              </button>
            </div>
          ))}

          {/* Explore more card — same size as other cards */}
          <Link href="/explore"
            className="
              group min-h-[360px] border-2 border-dashed border-[var(--border)]
              rounded-[var(--radius)] flex flex-col items-center justify-center p-8
              text-center space-y-4 hover:border-[var(--primary)]
              transition-all bg-[var(--surface-raised)]/30
            ">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center
              shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-black text-base text-[var(--text-primary)]">Explore More</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Browse all verified projects</p>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--primary)] font-bold text-sm">
              Go to Explorer <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Shortlist help */}
        <div className="p-8 bg-black text-white rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Need an expert second opinion?</h3>
            <p className="text-white/60 text-sm max-w-md">Our advisors have deep insights into these builders and can help you negotiate better deals. 100% Free.</p>
          </div>
          <button className="px-8 py-4 bg-[var(--primary)] text-white font-black rounded-xl shadow-[0_10px_20px_rgba(255,107,0,0.3)] hover:-translate-y-1 transition-all">
            Talk to Propcinity Advisor
          </button>
        </div>
      </SectionContainer>
    </div>
  );
}
