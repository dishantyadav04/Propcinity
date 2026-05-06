'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { Project } from "@/types/project";
import { formatINR } from "@/lib/finance-calculations";
import Skeleton from "@/components/ui/Skeleton";
import ProjectCard from "@/components/property/ProjectCard";
import {
  Search, SlidersHorizontal, X, LayoutGrid, List,
  Building2, MapPin, LayoutDashboard, ChevronDown, 
  ShieldCheck, ArrowUpDown, Check
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { addToCompare } from "@/lib/utils";

type SortOption = 'newest' | 'price_asc' | 'price_desc';
type ViewMode = 'grid' | 'list';

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [curatedIds, setCuratedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
    { value: 'newest', label: 'Newest First', icon: '🆕' },
    { value: 'price_asc', label: 'Price: Low → High', icon: '↑' },
    { value: 'price_desc', label: 'Price: High → Low', icon: '↓' },
  ]

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy)!

  useEffect(() => {
    setCuratedIds(JSON.parse(localStorage.getItem('curatedIds') || '[]'));
    setSavedIds(JSON.parse(localStorage.getItem('savedIds') || '[]'));
    const items: Project[] = JSON.parse(localStorage.getItem('compareItems') || '[]');
    setCompareIds(items.map(p => p.id));

    const onCompare = () => {
      const items: Project[] = JSON.parse(localStorage.getItem('compareItems') || '[]');
      setCompareIds(items.map(p => p.id));
    };
    window.addEventListener('compareUpdated', onCompare);
    return () => window.removeEventListener('compareUpdated', onCompare);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        setFiltered(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...projects];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.builderName || '').toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(p =>
        (p.unitConfigs || []).some(u => u.type === typeFilter)
      );
    }

    if (budgetFilter !== 'all') {
      const ranges: Record<string, [number, number]> = {
        'under-50': [0, 5000000],
        '50-1cr': [5000000, 10000000],
        '1cr-2cr': [10000000, 20000000],
        '2cr-plus': [20000000, Infinity],
      };
      const [min, max] = ranges[budgetFilter] || [0, Infinity];
      result = result.filter(p => {
        const price = (p.unitConfigs || []).length
          ? Math.min(...(p.unitConfigs || []).map(u => u.priceMin))
          : 0;
        return price >= min && price <= max;
      });
    }

    if (sortBy === 'price_asc') result.sort((a, b) =>
      (a.unitConfigs?.length ? Math.min(...a.unitConfigs.map(u => u.priceMin)) : 0) -
      (b.unitConfigs?.length ? Math.min(...b.unitConfigs.map(u => u.priceMin)) : 0)
    );
    if (sortBy === 'price_desc') result.sort((a, b) =>
      (b.unitConfigs?.length ? Math.min(...b.unitConfigs.map(u => u.priceMin)) : 0) -
      (a.unitConfigs?.length ? Math.min(...a.unitConfigs.map(u => u.priceMin)) : 0)
    );
    if (sortBy === 'newest') result.sort((a, b) =>
      new Date(b.launchDate || 0).getTime() - new Date(a.launchDate || 0).getTime()
    );

    setFiltered(result);
  }, [projects, searchQuery, sortBy, typeFilter, budgetFilter]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const toggleDashboard = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const isAdding = !curatedIds.includes(id);
    
    const nextCurated = isAdding
      ? [...curatedIds, id]
      : curatedIds.filter(i => i !== id);
    setCuratedIds(nextCurated);
    localStorage.setItem('curatedIds', JSON.stringify(nextCurated));

    if (isAdding) {
      const rejected = JSON.parse(localStorage.getItem('rejectedProjectIds') || '[]');
      const nextRejected = rejected.filter((rid: string) => rid !== id);
      localStorage.setItem('rejectedProjectIds', JSON.stringify(nextRejected));
    }

    window.dispatchEvent(new Event('curatedUpdated'));
    toast(isAdding ? 'Added to your matches' : 'Removed from matches');
  };

  const activeFilterCount = [
    typeFilter !== 'all', budgetFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-40">

      {/* ── Sticky search + filter bar ─────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 space-y-3">

          {/* Row 1: search + actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search project, area, builder..."
                className="w-full pl-9 pr-8 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                  rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)]
                  placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-xs)]
                border text-sm font-semibold transition-colors flex-shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)]'
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--primary)] text-white
                  text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div ref={sortRef} className="relative flex-shrink-0">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className={`
                  flex items-center gap-2 pl-3 pr-2.5 py-2.5
                  bg-[var(--surface-raised)] border rounded-[var(--radius-xs)]
                  text-sm font-semibold text-[var(--text-secondary)]
                  hover:border-[var(--primary)] hover:text-[var(--text-primary)]
                  transition-all whitespace-nowrap
                  ${sortOpen ? 'border-[var(--primary)] text-[var(--text-primary)]' : 'border-[var(--border)]'}
                `}>
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="hidden sm:inline">{currentSort.label}</span>
                <span className="sm:hidden">{currentSort.icon}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="
                      absolute right-0 top-[calc(100%+6px)] z-50
                      w-52 bg-white border border-[var(--border)]
                      rounded-[var(--radius)] shadow-[var(--shadow-lg)]
                      overflow-hidden
                    "
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                        Sort by
                      </p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5
                            rounded-[var(--radius-xs)] text-sm font-semibold
                            transition-all text-left
                            ${sortBy === opt.value
                              ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]'
                            }
                          `}>
                          <span className="text-base w-5 text-center">{opt.icon}</span>
                          <span className="flex-1">{opt.label}</span>
                          {sortBy === opt.value && (
                            <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:flex items-center bg-[var(--surface-raised)] rounded-[var(--radius-xs)] p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pb-2 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Type</span>
                    {['all', '1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot'].map(t => (
                      <button key={t} onClick={() => setTypeFilter(t)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                          typeFilter === t
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}>{t === 'all' ? 'All Types' : t}</button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Budget</span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'under-50', label: 'Under ₹50L' },
                      { id: '50-1cr', label: '₹50L–1Cr' },
                      { id: '1cr-2cr', label: '₹1Cr–2Cr' },
                      { id: '2cr-plus', label: '₹2Cr+' },
                    ].map(b => (
                      <button key={b.id} onClick={() => setBudgetFilter(b.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                          budgetFilter === b.id
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}>{b.label}</button>
                    ))}
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setTypeFilter('all'); setBudgetFilter('all'); }}
                      className="text-xs font-bold text-[var(--danger)] hover:underline ml-auto">
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {isLoading ? 'Loading...' : `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
              {activeFilterCount > 0 ? ' (filtered)' : ''}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setTypeFilter('all'); setBudgetFilter('all'); setSearchQuery(''); }}
                className="text-xs font-bold text-[var(--primary)]">
                Show all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <Skeleton key={i} className="h-[360px] rounded-[var(--radius)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="w-16 h-16 bg-[var(--surface-raised)] rounded-full flex items-center justify-center">
              <Search className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">No projects match</h3>
            <p className="text-sm text-[var(--text-secondary)]">Try adjusting your filters</p>
            <button
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); setBudgetFilter('all'); }}
              className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)]">
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project, index) => (
              <motion.div key={project.id} layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
                className="relative group"
              >
                <ProjectCard project={project} index={index} />
                <div className="absolute top-2 left-2 z-20">
                  <button
                    onClick={e => toggleDashboard(project.id, e)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-[10px]
                      shadow-lg backdrop-blur-md transition-all ${
                      curatedIds.includes(project.id)
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-white/90 text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white'
                    }`}>
                    <LayoutDashboard className="w-3 h-3" />
                    {curatedIds.includes(project.id) ? 'Shortlisted' : 'Add to Dashboard'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((project, index) => {
              const minPrice = project.unitConfigs?.length
                ? Math.min(...project.unitConfigs.map(u => u.priceMin)) : 0;
              const configs = Array.from(new Set((project.unitConfigs || []).map(u => u.type)));
              return (
                <motion.div key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.2) }}
                  className="relative bg-white border border-[var(--border)] rounded-[var(--radius)]
                    shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-shadow"
                >
                  <Link href={`/projects/${project.slug}`} className="flex gap-4 p-4 pr-28">
                    <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 rounded-[var(--radius-xs)] overflow-hidden bg-[var(--surface-raised)]">
                      {project.images?.[0]
                        ? <img src={project.images[0]} alt={project.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-[var(--text-muted)]" />
                          </div>
                      }
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-[var(--text-primary)] line-clamp-1"
                            style={{ fontFamily: 'var(--font-display)' }}>{project.name}</h3>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" /> {project.location}, {project.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-black text-[var(--primary)]"
                          style={{ fontFamily: 'var(--font-display)' }}>
                          {formatINR(minPrice)}
                        </span>
                        {configs.slice(0, 3).map(c => (
                          <span key={c} className="text-[10px] font-bold px-2 py-0.5
                            bg-[var(--surface-raised)] border border-[var(--border)]
                            rounded-full text-[var(--text-secondary)]">{c}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        {project.reraId && (
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
                            <span className="text-xs font-semibold text-[var(--success)]">RERA Verified</span>
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--surface-raised)] px-2 py-0.5 rounded">
                          {project.constructionStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleDashboard(project.id, e); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-xs)]
                        font-bold text-[10px] transition-all border ${
                        curatedIds.includes(project.id)
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="hidden sm:inline whitespace-nowrap">
                        {curatedIds.includes(project.id) ? 'Added ✓' : 'Add'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
