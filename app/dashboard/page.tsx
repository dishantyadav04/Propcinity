'use client';

import { useEffect, useState, useMemo } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import ProjectCard from "@/components/property/ProjectCard";
import { Project } from "@/types/project";
import { UserIntent } from "@/types/user";
import { Search, Sparkles, Heart, Star, ThumbsUp, ThumbsDown, ArrowRight, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const savedIntent = localStorage.getItem('userIntent');
    if (savedIntent) setUserIntent(JSON.parse(savedIntent));

    const dislikes = localStorage.getItem('dislikedIds');
    if (dislikes) setDislikedIds(JSON.parse(dislikes));

    const likes = localStorage.getItem('likedIds');
    if (likes) setLikedIds(JSON.parse(likes));

    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const curatedMatches = useMemo(() => {
    // Filter out disliked, sort by trust score + limit to 10 for velocity
    return projects
      .filter(p => !dislikedIds.includes(p.id))
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 10);
  }, [projects, dislikedIds]);

  const handleDislike = (id: string) => {
    const next = [...dislikedIds, id];
    setDislikedIds(next);
    localStorage.setItem('dislikedIds', JSON.stringify(next));
  };

  const handleLike = (id: string) => {
    const next = [...likedIds, id];
    setLikedIds(next);
    localStorage.setItem('likedIds', JSON.stringify(next));
    // Actually add to saved for real persistence
    const saved = JSON.parse(localStorage.getItem('savedIds') || '[]');
    if (!saved.includes(id)) {
      localStorage.setItem('savedIds', JSON.stringify([...saved, id]));
    }
  };

  if (isLoading) {
    return (
      <SectionContainer wide className="space-y-8 py-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="card-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[400px] w-full rounded-[var(--radius)]" />)}
        </div>
      </SectionContainer>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-white border-b border-[var(--border)] pt-10 pb-6">
        <SectionContainer wide>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>PropIQ Curation</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                Your Top Matches
              </h1>
              <p className="text-[var(--text-secondary)]">The most verified, high-trust projects in Pune, curated for you.</p>
            </div>
            <div className="flex items-center gap-2 bg-[var(--surface-raised)] p-1 rounded-[var(--radius-sm)]">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer wide className="py-8">
        <AnimatePresence mode="popLayout">
          {curatedMatches.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-[var(--surface-raised)] rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xl">No more matches!</h3>
                <p className="text-[var(--text-secondary)] max-w-xs">You've gone through all our curated recommendations. Try expanding your search in the explore page.</p>
              </div>
              <Link href="/explore" className="px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-full shadow-[var(--shadow-primary)] flex items-center gap-2">
                Explore More <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className={viewMode === 'grid' ? 'card-grid' : 'space-y-4'}>
              {curatedMatches.map((project, index) => (
                <motion.div
                  layout
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <ProjectCard project={project} index={index} />
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* These buttons are overlays for quick action in the dashboard curation view */}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <button 
                      onClick={() => handleDislike(project.id)}
                      className="flex-1 py-3 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-gray-50 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" /> Not Interested
                    </button>
                    <button 
                      onClick={() => handleLike(project.id)}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                        likedIds.includes(project.id) 
                          ? 'bg-[var(--success)] text-white' 
                          : 'bg-[var(--primary)] text-white hover:opacity-90'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" /> 
                      {likedIds.includes(project.id) ? 'Shortlisted' : 'I Like This'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </SectionContainer>
    </div>
  );
}
