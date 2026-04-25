'use client';

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Project } from "@/types/project";
import { formatINR } from "@/lib/finance-calculations";
import Skeleton from "@/components/ui/Skeleton";
import { Search, SlidersHorizontal, MapPin, X, Building2, Star, Heart } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--surface-raised)] animate-pulse" />,
});

type RiskFilter = 'all' | 'low' | 'medium' | 'high';
type SortOption = 'trust' | 'price_asc' | 'price_desc';

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('trust');
  const [showFilters, setShowFilters] = useState(false);
  const [curatedIds, setCuratedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setCuratedIds(JSON.parse(localStorage.getItem('curatedIds') || '[]'));
    setSavedIds(JSON.parse(localStorage.getItem('savedIds') || '[]'));
  }, []);

  const toggleCurated = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = curatedIds.includes(id) ? curatedIds.filter(i => i !== id) : [...curatedIds, id];
    setCuratedIds(next);
    localStorage.setItem('curatedIds', JSON.stringify(next));
    window.dispatchEvent(new Event('curatedUpdated'));
    toast(next.includes(id) ? 'Added to Dashboard ⭐' : 'Removed from Dashboard');
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedIds.includes(id) ? savedIds.filter(i => i !== id) : [...savedIds, id];
    setSavedIds(next);
    localStorage.setItem('savedIds', JSON.stringify(next));
    toast(next.includes(id) ? 'Saved to Shortlist ❤️' : 'Removed from Shortlist');
  };

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        setFiltered(data);
        if (data.length > 0) setSelectedProject(data[0]);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...projects];
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.builderName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (riskFilter !== 'all') result = result.filter(p => p.riskLabel === riskFilter);
    if (sortBy === 'trust') result.sort((a, b) => b.trustScore - a.trustScore);
    if (sortBy === 'price_asc') result.sort((a, b) =>
      Math.min(...(a.unitConfigs.length ? a.unitConfigs.map(u => u.priceMin) : [0])) -
      Math.min(...(b.unitConfigs.length ? b.unitConfigs.map(u => u.priceMin) : [0]))
    );
    if (sortBy === 'price_desc') result.sort((a, b) =>
      Math.min(...(b.unitConfigs.length ? b.unitConfigs.map(u => u.priceMin) : [0])) -
      Math.min(...(a.unitConfigs.length ? a.unitConfigs.map(u => u.priceMin) : [0]))
    );
    setFiltered(result);
    if (result.length > 0 && !result.find(p => p.id === selectedProject?.id)) {
      setSelectedProject(result[0]);
    }
  }, [projects, searchQuery, riskFilter, sortBy]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const riskStyle = (risk: string) => ({
    low: 'bg-[var(--success-light)] text-[var(--success)]',
    medium: 'bg-[var(--warning-light)] text-[var(--warning)]',
    high: 'bg-[var(--danger-light)] text-[var(--danger)]',
  }[risk] || '');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Search + filter bar */}
      <div className="bg-white border-b border-[var(--border)] px-4 sm:px-6 py-3 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search project, location, builder..."
              className="w-full pl-9 pr-9 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-xs)]
              border text-sm font-semibold transition-colors flex-shrink-0 ${
              showFilters || riskFilter !== 'all'
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] text-[var(--text-secondary)]'
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Risk:</span>
                  {(['all', 'low', 'medium', 'high'] as const).map(r => (
                    <button key={r} onClick={() => setRiskFilter(r)}
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                        riskFilter === r ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-raised)] text-[var(--text-secondary)]'
                      }`}>{r}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Sort:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
                    className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--surface-raised)]
                      border border-[var(--border)] rounded-[var(--radius-xs)] px-2 py-1
                      focus:outline-none focus:border-[var(--primary)]">
                    <option value="trust">Trust Score</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-[var(--text-muted)] font-medium">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          {riskFilter !== 'all' ? ` · ${riskFilter} risk` : ''}
          {searchQuery ? ` · "${searchQuery}"` : ''}
        </p>
      </div>

      {/* Split view — always split, no toggle */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-3 w-full max-w-sm px-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-[var(--radius)]" />)}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* Project list — always visible */}
          <div className="w-full md:w-[400px] lg:w-[460px] flex-shrink-0 overflow-y-auto
            border-r border-[var(--border)] bg-[var(--surface-raised)]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center space-y-3">
                <Search className="w-10 h-10 text-[var(--text-muted)]" />
                <p className="font-bold text-[var(--text-primary)]">No projects match</p>
                <button onClick={() => { setSearchQuery(''); setRiskFilter('all'); }}
                  className="text-sm text-[var(--primary)] font-bold">Clear filters</button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map(project => {
                  const minPrice = project.unitConfigs.length
                    ? Math.min(...project.unitConfigs.map(u => u.priceMin)) : 0;
                  const isSelected = selectedProject?.id === project.id;

                  return (
                    <div key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--primary-light)] border-l-2 border-[var(--primary)]'
                          : 'bg-white hover:bg-[var(--surface-raised)]'
                      }`}>
                      <div className="flex gap-3">
                        <div className="w-16 h-16 flex-shrink-0 rounded-[var(--radius-xs)] overflow-hidden bg-[var(--surface-raised)]">
                          {project.images?.[0]
                            ? <img src={project.images[0]} alt={project.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 text-[var(--text-muted)]" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-sm text-[var(--text-primary)] line-clamp-1">
                              {project.name}
                            </p>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${riskStyle(project.riskLabel)}`}>
                              {project.riskLabel}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {project.location}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-black text-[var(--primary)]">{formatINR(minPrice)}</p>
                            <div className="flex items-center gap-1.5">
                              {/* Add to curated (dashboard) */}
                              <button
                                onClick={(e) => toggleCurated(project.id, e)}
                                title="Add to Dashboard"
                                className={`p-1.5 rounded-full transition-all text-sm ${
                                  curatedIds.includes(project.id)
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--primary)]'
                                }`}>
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              {/* Save */}
                              <button
                                onClick={(e) => toggleSave(project.id, e)}
                                title="Save to Shortlist"
                                className={`p-1.5 rounded-full transition-all ${
                                  savedIds.includes(project.id)
                                    ? 'bg-[var(--danger)] text-white'
                                    : 'bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--danger)]'
                                }`}>
                                <Heart className="w-3.5 h-3.5" />
                              </button>
                              <Link href={`/projects/${project.slug}`}
                                onClick={e => e.stopPropagation()}
                                className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                                View →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map — hidden on mobile, visible on md+ */}
          <div className="hidden md:flex flex-1 relative">
            {selectedProject ? (
              <MapView
                key={selectedProject.id}
                lat={selectedProject.lat}
                lng={selectedProject.lng}
                projectName={selectedProject.name}
                priceLabel={formatINR(
                  selectedProject.unitConfigs.length
                    ? Math.min(...selectedProject.unitConfigs.map(u => u.priceMin)) : 0
                )}
                zoom={14}
                className="h-full w-full"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[var(--surface-raised)]">
                <p className="text-[var(--text-muted)] text-sm">Select a project to see on map</p>
              </div>
            )}

            {/* Selected project floating card */}
            {selectedProject && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20
                bg-white rounded-[var(--radius)] shadow-[var(--shadow-lg)]
                px-4 py-2.5 flex items-center gap-3 max-w-xs w-full">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--text-primary)] truncate">{selectedProject.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{selectedProject.location}</p>
                </div>
                <Link href={`/projects/${selectedProject.slug}`}
                  className="flex-shrink-0 px-3 py-1.5 bg-[var(--primary)] text-white
                    text-xs font-bold rounded-[var(--radius-xs)]">
                  View
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
