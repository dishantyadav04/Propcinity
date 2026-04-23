'use client';

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import { formatINR } from "@/lib/finance-calculations";
import { Heart, Trash2, GitCompare, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import SectionContainer from "@/components/layout/SectionContainer";

export default function SavedPage() {
  const router = useRouter();
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const savedIds: string[] = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    if (!savedIds.length) { setIsLoading(false); return; }

    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        setSavedProjects(data.filter((p: Project) => savedIds.includes(p.id)));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const removeFromSaved = (projectId: string) => {
    const current: string[] = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    const updated = current.filter(id => id !== projectId);
    localStorage.setItem('savedProjects', JSON.stringify(updated));
    setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    setSelected(prev => prev.filter(id => id !== projectId));
    toast.success('Removed from saved');
  };

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 3 ? [...prev, id] : (toast.error('Max 3 projects for comparison'), prev)
    );
  };

  const handleCompare = () => {
    if (selected.length < 2) { toast.error('Select at least 2 projects'); return; }
    router.push(`/compare?ids=${selected.join(',')}`);
  };

  const riskStyle = (risk: string) => ({
    low: 'bg-[var(--success-light)] text-[var(--success)]',
    medium: 'bg-[var(--warning-light)] text-[var(--warning)]',
    high: 'bg-[var(--danger-light)] text-[var(--danger)]',
  }[risk] || '');

  return (
    <div className="min-h-screen bg-[var(--background)] pb-28">
      {/* Compare sticky bar */}
      <AnimatePresence>
        {selected.length >= 2 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50
              max-w-lg mx-auto bg-[var(--primary)] text-white rounded-[var(--radius)]
              shadow-[var(--shadow-primary)] px-5 py-4
              flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black">{selected.length} selected</p>
              <p className="text-xs text-white/70">Ready to compare</p>
            </div>
            <button onClick={handleCompare}
              className="flex items-center gap-2 px-4 py-2.5 bg-white
                text-[var(--primary)] text-sm font-black rounded-[var(--radius-xs)]">
              <GitCompare className="w-4 h-4" /> Compare Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SectionContainer wide>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-[var(--surface-raised)] rounded-[var(--radius-xs)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}>
              My Shortlist
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {savedProjects.length} saved · Tap to select for comparison
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-64 shimmer rounded-[var(--radius)]" />)}
          </div>
        ) : savedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-5 text-center">
            <div className="w-20 h-20 bg-[var(--primary-light)] rounded-full
              flex items-center justify-center">
              <Heart className="w-9 h-9 text-[var(--primary)]" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>Nothing saved yet</h2>
            <p className="text-[var(--text-secondary)] max-w-xs">
              Browse projects and tap the heart icon to save your favourites here.
            </p>
            <Link href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)]
                text-white text-sm font-bold rounded-[var(--radius)] shadow-[var(--shadow-primary)]
                hover:opacity-90 transition-opacity">
              <Search className="w-4 h-4" /> Start Exploring
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedProjects.map((project, i) => {
              const minPrice = project.unitConfigs.length
                ? Math.min(...project.unitConfigs.map(u => u.priceMin))
                : 0;
              const isSelected = selected.includes(project.id);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative bg-white border-2 rounded-[var(--radius)] overflow-hidden
                    shadow-[var(--shadow-sm)] transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--primary)] shadow-[var(--shadow-primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                  }`}
                  onClick={() => toggleSelect(project.id)}
                >
                  {/* Select indicator */}
                  <div className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-full border-2
                    flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[var(--primary)] border-[var(--primary)]'
                      : 'bg-white/80 border-[var(--border-strong)]'
                  }`}>
                    {isSelected && <span className="text-white text-xs font-black">✓</span>}
                  </div>

                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-[var(--surface-raised)] relative">
                    {project.images?.[0] ? (
                      <img src={project.images[0]} alt={project.name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center
                        text-[var(--text-muted)] text-sm">No image</div>
                    )}
                    <span className={`absolute top-3 right-3 text-[10px] font-bold
                      px-2 py-0.5 rounded-full capitalize ${riskStyle(project.riskLabel)}`}>
                      {project.riskLabel} risk
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] line-clamp-1"
                        style={{ fontFamily: 'var(--font-display)' }}>{project.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{project.location}, {project.city}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-[var(--primary)]"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        {formatINR(minPrice)}
                      </p>
                      <span className="text-xs text-[var(--text-muted)] font-medium">
                        Trust: {project.trustScore}/100
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Link href={`/projects/${project.slug}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 py-2 bg-[var(--primary-light)] text-[var(--primary)]
                          text-xs font-bold rounded-[var(--radius-xs)] text-center
                          hover:bg-[var(--primary)] hover:text-white transition-colors">
                        View Details
                      </Link>
                      <button onClick={e => { e.stopPropagation(); removeFromSaved(project.id); }}
                        className="p-2 bg-[var(--danger-light)] text-[var(--danger)]
                          rounded-[var(--radius-xs)] hover:opacity-80 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
