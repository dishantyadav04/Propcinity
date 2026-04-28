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

  // Matching Engine
  const matches = useMemo(() => {
    if (!userIntent || projects.length === 0) return { perfect: [], closest: [] };

    const scored = projects.map(p => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Location (Weight: 40)
      const locMatch = userIntent.subLocations?.some((sl: string) => {
        const pLoc = (p.location || '').toLowerCase();
        const slLow = sl.toLowerCase();
        return pLoc.includes(slLow) || slLow.includes(pLoc);
      });

      if (locMatch) {
        score += 40;
        reasons.push('Matches your preferred locality');
      }

      // 2. Budget (Weight: 30)
      const pPrice = p.unitConfigs?.length ? Math.min(...p.unitConfigs.map(u => u.priceMin)) : 0;
      const uMin = userIntent.budget.min;
      const uMax = userIntent.budget.max;
      const uOpen = userIntent.budget.isOpenMax;

      if (pPrice >= uMin && (uOpen || pPrice <= uMax)) {
        score += 30;
        reasons.push('Within your budget range');
      } else if (pPrice >= uMin * 0.8 && (uOpen || pPrice <= uMax * 1.2)) {
        score += 15;
        reasons.push('Slightly outside preferred budget');
      }

      // 3. BHK/Config (Weight: 20)
      const uBhk = userIntent.bhkType || [];
      const pBhks = (p.unitConfigs || []).map(u => u.type);
      const hasBhkMatch = uBhk.some(b => pBhks.some(pb => pb.includes(b.split('BHK')[0])));
      if (hasBhkMatch) {
        score += 20;
        reasons.push('Matches required BHK configuration');
      }

      // 4. Purpose (Weight: 10)
      if (userIntent.purpose === 'investment' && p.trustScore > 85) {
        score += 10;
        reasons.push('High trust score (Great for Investment)');
      } else if (userIntent.purpose === 'self-use' && p.amenities.length > 8) {
        score += 10;
        reasons.push('Amenity rich (Great for Family)');
      }

      return { ...p, matchScore: score, matchReasons: reasons };
    });

    const perfect = scored.filter(p => p.matchScore >= 90).sort((a, b) => b.matchScore - a.matchScore);
    const closest = scored.filter(p => p.matchScore >= 40 && p.matchScore < 90).sort((a, b) => b.matchScore - a.matchScore);

    return { perfect, closest };
  }, [projects, userIntent]);

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
        <div className="card-grid">
          {[...matches.perfect, ...matches.closest.slice(0, Math.max(0, 10 - matches.perfect.length))].map((p, i) => (
            <div key={p.id} className="relative group">
              <ProjectCard project={p} index={i} />
              {/* Remove button — shown on hover */}
              <button
                onClick={() => removeFromCurated(p.id)}
                className="absolute top-2 left-2 z-30 w-7 h-7 bg-black/60 backdrop-blur-sm
                  text-white rounded-full items-center justify-center
                  hidden group-hover:flex transition-all hover:bg-[var(--danger)]"
                title="Remove from dashboard">
                <X className="w-3.5 h-3.5" />
              </button>
              {/* Match % badge — bottom right of image, not overlapping trust score */}
              {p.matchScore >= 40 && (
                <div className="absolute bottom-[120px] right-3 z-20">
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full text-white ${
                    p.matchScore >= 90
                      ? 'bg-[var(--success)]'
                      : p.matchScore >= 70
                        ? 'bg-[var(--primary)]'
                        : 'bg-[var(--warning)]'
                  }`}>
                    {p.matchScore}% match
                  </span>
                </div>
              )}
            </div>
          ))}
          {/* Explore more CTA card */}
          <Link href="/explore"
            className="group h-full min-h-[360px] border-2 border-dashed border-[var(--border)]
              rounded-[2rem] flex flex-col items-center justify-center p-8 text-center
              space-y-4 hover:border-[var(--primary)] transition-all bg-[var(--surface-raised)]/50">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center
              shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-[var(--text-primary)]">Explore More</h3>
              <p className="text-sm text-[var(--text-secondary)]">Browse all verified projects</p>
            </div>
            <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
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
