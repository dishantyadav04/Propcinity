'use client';

import { useEffect, useState, useMemo } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import ProjectCard from "@/components/property/ProjectCard";
import { Project } from "@/types/project";
import { UserIntent } from "@/types/user";
import { Search, Sparkles, X, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "@/components/ui/Skeleton";
import { toast } from "sonner";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // curatedIds = IDs the user has added to their curated list
  const [curatedIds, setCuratedIds] = useState<string[]>([]);

  useEffect(() => {
    const savedIntent = localStorage.getItem('userIntent');
    if (savedIntent) setUserIntent(JSON.parse(savedIntent));

    // Load curated IDs (can be added from explore page)
    const saved = JSON.parse(localStorage.getItem('curatedIds') || '[]');
    setCuratedIds(saved);

    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Listen for curated updates from explore page
  useEffect(() => {
    const handler = () => {
      const ids = JSON.parse(localStorage.getItem('curatedIds') || '[]');
      setCuratedIds(ids);
    };
    window.addEventListener('curatedUpdated', handler);
    return () => window.removeEventListener('curatedUpdated', handler);
  }, []);

  // Curated list: user-selected IDs + top 10 by trust score as default
  const curatedProjects = useMemo(() => {
    if (curatedIds.length > 0) {
      return projects.filter(p => curatedIds.includes(p.id));
    }
    // Default: show top 10 by trust score
    return projects.sort((a, b) => b.trustScore - a.trustScore).slice(0, 10);
  }, [projects, curatedIds]);

  const removeFromCurated = (id: string) => {
    const updated = curatedIds.filter(cid => cid !== id);
    // If was using defaults and user removes one, lock in current list minus removed
    const effectiveIds = curatedIds.length > 0
      ? curatedIds
      : curatedProjects.map(p => p.id);
    const next = effectiveIds.filter(cid => cid !== id);
    setCuratedIds(next);
    localStorage.setItem('curatedIds', JSON.stringify(next));
    window.dispatchEvent(new Event('curatedUpdated'));
    toast('Removed from your list');
  };

  const userName = userIntent ? (userIntent as any).name?.split(' ')[0] || null : null;

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
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] pt-8 pb-6">
        <SectionContainer wide>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curated Matches</span>
                <span className="bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded-full font-black">
                  {curatedProjects.length}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>
                Top Picks For You
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Your personally curated shortlist · Add more from Explore
              </p>
            </div>
            <Link href="/explore"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5
                bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)]
                shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
              <Search className="w-4 h-4" /> Explore Projects
            </Link>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer wide className="py-6">
        <AnimatePresence mode="popLayout">
          {curatedProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center space-y-5"
            >
              <div className="w-20 h-20 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-[var(--primary)]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[var(--text-primary)]">Your list is empty</h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                  Browse projects in Explore and add them to your curated list.
                </p>
              </div>
              <Link href="/explore"
                className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white
                  font-bold rounded-[var(--radius)] shadow-[var(--shadow-primary)]">
                <Plus className="w-4 h-4" /> Add Projects
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="card-grid">
                {curatedProjects.map((project, index) => (
                  <motion.div
                    layout
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group"
                  >
                    <ProjectCard project={project} index={index} />
                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCurated(project.id)}
                      className="absolute top-3 right-3 z-20 w-7 h-7 bg-black/50 backdrop-blur-sm
                        text-white rounded-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--danger)]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Add more button at bottom */}
              <div className="mt-8 flex justify-center">
                <Link href="/explore"
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--surface)]
                    border-2 border-[var(--border-strong)] text-[var(--text-primary)]
                    text-sm font-bold rounded-[var(--radius)] hover:border-[var(--primary)]
                    transition-colors">
                  <Plus className="w-4 h-4" /> Add More Projects from Explorer
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
