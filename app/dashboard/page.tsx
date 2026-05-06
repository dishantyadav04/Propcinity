'use client';

import { useEffect, useState, useMemo } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import ProjectCard from "@/components/property/ProjectCard";
import { Project } from "@/types/project";
import { UserIntent } from "@/types/user";
import { Search, Sparkles, X, ArrowRight, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import { toast } from "sonner";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [aiRecommended, setAiRecommended] = useState<string[]>([])
  const [aiReasoning, setAiReasoning] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState(false)
  const [curatedIds, setCuratedIds] = useState<string[]>([])
  const [rejectedIds, setRejectedIds] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedIntent = localStorage.getItem('userIntent');
    if (savedIntent) setUserIntent(JSON.parse(savedIntent));

    const savedCurated = JSON.parse(localStorage.getItem('curatedIds') || '[]');
    setCuratedIds(savedCurated);

    const savedRejected = JSON.parse(localStorage.getItem('rejectedProjectIds') || '[]');
    setRejectedIds(savedRejected);

    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));

    const handler = () => {
      setCuratedIds(JSON.parse(localStorage.getItem('curatedIds') || '[]'));
      setRejectedIds(JSON.parse(localStorage.getItem('rejectedProjectIds') || '[]'));
    };
    window.addEventListener('curatedUpdated', handler);
    return () => window.removeEventListener('curatedUpdated', handler);
  }, []);

  useEffect(() => {
    if (!userIntent || projects.length === 0) return
    setAiLoading(true)

    fetch('/api/ai/ask', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIntent, projects }),
    })
      .then(r => r.json())
      .then(data => {
        setAiRecommended(data.recommended || [])
        setAiReasoning(data.reasoning || {})
      })
      .catch(() => {
        // Fallback: sort by construction percent
        const sorted = [...projects].sort((a, b) =>
          (b.constructionPercent || 0) - (a.constructionPercent || 0)
        )
        setAiRecommended(sorted.slice(0, 10).map(p => p.id))
      })
      .finally(() => setAiLoading(false))
  }, [userIntent, projects])

  const displayResults = useMemo(() => {
    const rejectedSet = new Set(rejectedIds);
    const filteredProjects = projects.filter(p => !rejectedSet.has(p.id));

    if (curatedIds.length > 0) {
      return filteredProjects.filter(p => curatedIds.includes(p.id))
    }
    if (aiRecommended.length > 0) {
      const recommended = aiRecommended
        .map(id => filteredProjects.find(p => p.id === id))
        .filter(Boolean) as Project[]
      const rest = filteredProjects
        .filter(p => !aiRecommended.includes(p.id))
        .sort((a, b) => (b.constructionPercent || 0) - (a.constructionPercent || 0))
      return [...recommended, ...rest].slice(0, 12)
    }
    return [...filteredProjects]
      .sort((a, b) => (b.constructionPercent || 0) - (a.constructionPercent || 0))
      .slice(0, 12)
  }, [projects, aiRecommended, curatedIds, rejectedIds])

  const handleRemove = (id: string) => {
    const rejected = JSON.parse(localStorage.getItem('rejectedProjectIds') || '[]');
    if (!rejected.includes(id)) {
      rejected.push(id);
      localStorage.setItem('rejectedProjectIds', JSON.stringify(rejected));
      setRejectedIds([...rejected]);
    }

    const curated = JSON.parse(localStorage.getItem('curatedIds') || '[]');
    const nextCurated = curated.filter((c: string) => c !== id);
    if (nextCurated.length !== curated.length) {
      localStorage.setItem('curatedIds', JSON.stringify(nextCurated));
      setCuratedIds(nextCurated);
      window.dispatchEvent(new Event('curatedUpdated'));
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
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {aiLoading ? 'AI Recommending...' : 'AI-Powered Recommendations'}
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
          {displayResults.map((project, i) => (
            <div key={project.id} className="relative group">
              <ProjectCard project={project} index={i} hideRiskBadge={true} />
              
              {/* Risk/Remove overlay top-left */}
              <div className="absolute top-3 left-3 z-30" style={{ height: '24px', minWidth: '64px' }}>
                <span
                  className="absolute inset-0 inline-flex items-center justify-center
                    px-2.5 text-[10px] font-bold rounded-full whitespace-nowrap
                    transition-all duration-150
                    group-hover:opacity-0 group-hover:pointer-events-none"
                  style={{
                    background:
                      project.constructionPercent >= 80 ? 'var(--success-light)' :
                      project.constructionPercent >= 40 ? 'var(--warning-light)' :
                      'var(--danger-light)',
                    color:
                      project.constructionPercent >= 80 ? 'var(--success)' :
                      project.constructionPercent >= 40 ? 'var(--warning)' :
                      'var(--danger)',
                  }}
                >
                  {project.constructionStatus.replace('_', ' ')}
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
                  <X className="w-3 h-3" />
                  Remove
                </button>
              </div>

              {/* AI reasoning tooltip — show on hover if available */}
              {aiReasoning[project.id] && (
                <div className="absolute bottom-full left-0 mb-1 z-40
                  hidden group-hover:block w-64 p-2.5 bg-[var(--surface-dark)] text-white
                  text-[10px] rounded-[var(--radius-xs)] shadow-lg leading-relaxed">
                  <p className="font-bold text-[var(--primary)] mb-0.5">Why recommended</p>
                  {aiReasoning[project.id]}
                </div>
              )}
            </div>
          ))}

          {/* Explore more card */}
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
