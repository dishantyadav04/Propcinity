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
import { rankProjects } from '@/lib/onboarding-matcher'
import type { MatchResult, MatcherState } from '@/types/matcher'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rankedProjects, setRankedProjects] = useState<MatchResult[]>([]);
  const [backupProjects, setBackupProjects] = useState<MatchResult[]>([]);

  useEffect(() => {
    const savedIntent = localStorage.getItem('userIntent');
    if (savedIntent) setUserIntent(JSON.parse(savedIntent));

    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // STATE 1 & 2: INITIAL LOAD & PREFERENCE UPDATE
  useEffect(() => {
    if (projects.length === 0) return;

    let allMatches: MatchResult[] = [];
    if (!userIntent) {
      allMatches = [...projects]
        .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))
        .map(p => ({
          project: p, score: p.trustScore || 50, matchPct: p.trustScore || 50,
          tier: 'fallback' as const, reasons: ['Highly trusted project'], flags: [],
        }));
    } else {
      const state: MatcherState = {
        city: (userIntent as any).city || userIntent.location || 'Pune',
        subLocations: (userIntent as any).subLocations || [],
        purpose: userIntent.purpose || '',
        propertyType: userIntent.propertyType || [],
        bhkType: (userIntent as any).bhkType || [],
        budgetMin: userIntent.budget?.min || 0,
        budgetMax: userIntent.budget?.max || 0,
        isOpenMax: userIntent.budget?.isOpenMax || false,
        timeline: userIntent.timeline || '',
        preferences: (userIntent as any).preferences || [],
      };
      allMatches = rankProjects(projects, state);
    }

    const rejectedSet = new Set(JSON.parse(localStorage.getItem('rejectedProjectIds') || '[]'));
    const curatedIds = JSON.parse(localStorage.getItem('curatedIds') || '[]');

    const validMatches = allMatches.filter(r => !rejectedSet.has(r.project.id));

    const curatedNotRanked = curatedIds
      .filter((id: string) => !rejectedSet.has(id) && !validMatches.some(r => r.project.id === id))
      .map((id: string) => {
        const p = projects.find(proj => proj.id === id);
        return p ? {
          project: p, score: 100, matchPct: 100, tier: 'exact' as const, reasons: ['Shortlisted by you'], flags: []
        } : null;
      }).filter(Boolean) as MatchResult[];

    const curatedMatches = validMatches.filter(r => curatedIds.includes(r.project.id));
    const otherMatches = validMatches.filter(r => !curatedIds.includes(r.project.id));

    const finalPool = [...curatedNotRanked, ...curatedMatches, ...otherMatches];

    setRankedProjects(finalPool.slice(0, 10));
    setBackupProjects(finalPool.slice(10));
  }, [projects, userIntent]);

  // Handle Explorer additions
  useEffect(() => {
    const handler = () => {
      const curated = JSON.parse(localStorage.getItem('curatedIds') || '[]');
      const rejected = JSON.parse(localStorage.getItem('rejectedProjectIds') || '[]');

      setRankedProjects(prev => {
        let updated = [...prev];
        let changed = false;

        curated.forEach((id: string) => {
          if (!rejected.includes(id) && !updated.some(r => r.project.id === id)) {
            const proj = projects.find(p => p.id === id);
            if (proj) {
              updated.unshift({
                project: proj, score: 100, matchPct: 100, tier: 'exact' as const, reasons: ['Shortlisted by you'], flags: []
              });
              changed = true;
            }
          }
        });

        return changed ? updated : prev;
      });
    };
    window.addEventListener('curatedUpdated', handler);
    return () => window.removeEventListener('curatedUpdated', handler);
  }, [projects]);

  // STATE 3: PROPERTY REMOVAL
  const handleRemove = (id: string) => {
    // 1. Update localStorage
    const rejected = JSON.parse(localStorage.getItem('rejectedProjectIds') || '[]');
    if (!rejected.includes(id)) {
      rejected.push(id);
      localStorage.setItem('rejectedProjectIds', JSON.stringify(rejected));
    }

    const curated = JSON.parse(localStorage.getItem('curatedIds') || '[]');
    const nextCurated = curated.filter((c: string) => c !== id);
    if (nextCurated.length !== curated.length) {
      localStorage.setItem('curatedIds', JSON.stringify(nextCurated));
      window.dispatchEvent(new Event('curatedUpdated'));
    }

    // 2. Shift from backup pool without re-running matching
    const idx = rankedProjects.findIndex(r => r.project.id === id);
    if (idx > -1) {
      const nextRanked = [...rankedProjects];
      nextRanked.splice(idx, 1);
      
      const nextBackup = [...backupProjects];
      if (nextBackup.length > 0) {
        const nextProject = nextBackup.shift()!;
        nextRanked.push(nextProject);
      }
      
      setRankedProjects(nextRanked);
      setBackupProjects(nextBackup);
    }
    
    toast('Removed');
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
          {rankedProjects.map((result, i) => (
            <div key={result.project.id} className="relative group">

              {/* ProjectCard with internal risk badge suppressed */}
              <ProjectCard
                project={result.project}
                index={i}
                hideRiskBadge={true}
              />

              {/*
                TOP-LEFT: Risk pill normally, Remove on hover.
                Both are h-6 (24px) so they match exactly.
                Both use absolute inset-0 so they occupy same space.
                No layout shift. No duplicate badges.
              */}
              <div className="absolute top-3 left-3 z-30" style={{ height: '24px', minWidth: '64px' }}>
                {/* Risk — always visible, fades on card hover */}
                <span
                  className="absolute inset-0 inline-flex items-center justify-center
                    px-2.5 text-[10px] font-bold rounded-full whitespace-nowrap
                    transition-all duration-150
                    group-hover:opacity-0 group-hover:pointer-events-none"
                  style={{
                    background:
                      result.project.riskLabel === 'low' ? 'var(--success-light)' :
                      result.project.riskLabel === 'medium' ? 'var(--warning-light)' :
                      'var(--danger-light)',
                    color:
                      result.project.riskLabel === 'low' ? 'var(--success)' :
                      result.project.riskLabel === 'medium' ? 'var(--warning)' :
                      'var(--danger)',
                  }}
                >
                  {result.project.riskLabel === 'low' ? 'Low Risk' :
                   result.project.riskLabel === 'medium' ? 'Med Risk' : 'High Risk'}
                </span>

                {/* Remove pill — appears on card hover */}
                <button
                  onClick={() => handleRemove(result.project.id)}
                  className="absolute inset-0 inline-flex items-center justify-center gap-1
                    px-2.5 text-[10px] font-bold rounded-full whitespace-nowrap
                    bg-[var(--danger)] text-white
                    opacity-0 pointer-events-none
                    group-hover:opacity-100 group-hover:pointer-events-auto
                    transition-all duration-150 hover:brightness-90"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              </div>

              {/*
                TOP-RIGHT: Match % — same height as risk pill (h-6 = 24px).
                Only shown if score is meaningful (>= 20%).
              */}
              {result.matchPct >= 20 && (
                <div className="absolute top-3 right-3 z-20 pointer-events-none">
                  <span
                    className="inline-flex items-center justify-center
                      px-2.5 text-[10px] font-black text-white
                      rounded-full whitespace-nowrap shadow-sm"
                    style={{
                      height: '24px',
                      background:
                        result.tier === 'exact' ? 'var(--success)' :
                        result.tier === 'close' ? 'var(--primary)' :
                        'rgba(0,0,0,0.45)',
                    }}
                  >
                    {result.matchPct}% match
                  </span>
                </div>
              )}

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
