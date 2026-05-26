'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Project } from '@/types/project';
import { formatINR } from '@/lib/finance-calculations';
import Skeleton from '@/components/ui/Skeleton';
import ProjectCard from '@/components/property/ProjectCard';
import {
  Search, SlidersHorizontal, X, LayoutGrid, List,
  Building2, MapPin, Star, LayoutDashboard,
  ChevronDown, TrendingUp, ShieldCheck, Check,
  ArrowUpDown, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { addToCompare } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--surface-raised)] animate-pulse" />,
});

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';
type ViewMode = 'grid' | 'list';

// Score a project against user's intent (pure function, no localStorage)
function scoreByIntent(project: Project, intent: any): number {
  if (!intent) return 0;
  let score = 0;

  // City must match
  if ((project.city || '').toLowerCase() !== (intent.city || 'pune').toLowerCase()) {
    return -1; // exclude
  }

  // Sub-location
  if (intent.subLocations?.length > 0) {
    const pLoc = (project.location || '').toLowerCase();
    const match = intent.subLocations.some((sl: string) => {
      const s = sl.toLowerCase();
      return pLoc.includes(s) || s.includes(pLoc);
    });
    score += match ? 30 : 5;
  } else {
    score += 15;
  }

  // Property type
  if (intent.propertyType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const match = intent.propertyType.some((sel: string) => {
      const s = sel.toLowerCase();
      if (s === 'apartment') return types.some((t: string) =>
        /^\d/.test(t) || t.includes('bhk') || t.includes('studio') || t.includes('rk')
      );
      if (s === 'villa') return types.some((t: string) =>
        t.includes('villa') || t.includes('row house')
      );
      if (s === 'plot') return types.some((t: string) => t.includes('plot'));
      return false;
    });
    score += match ? 20 : 3;
  } else {
    score += 10;
  }

  // BHK
  if (intent.bhkType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const match = intent.bhkType.some((bhk: string) => {
      const b = bhk.toLowerCase();
      return types.some((t: string) => t === b || t.includes(b));
    });
    score += match ? 20 : 3;
  } else {
    score += 10;
  }

  // Budget
  if (intent.budget?.min > 0 || intent.budget?.max > 0) {
    const uMin = intent.budget.min || 0;
    const uMax = intent.budget.isOpenMax ? Infinity : (intent.budget.max || Infinity);
    const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean);
    if (prices.length > 0) {
      const pMin = Math.min(...prices);
      const pMax = Math.max(...(project.unitConfigs || []).map((u: any) => u.priceMax || u.priceMin).filter(Boolean));
      score += (pMin <= uMax && pMax >= uMin) ? 20 : 2;
    }
  } else {
    score += 10;
  }

  return score;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'relevance',  label: 'Best Match',        icon: '⭐' },
  { value: 'price_asc',  label: 'Price: Low → High', icon: '↑' },
  { value: 'price_desc', label: 'Price: High → Low', icon: '↓' },
  { value: 'newest',     label: 'Newest First',       icon: '🆕' },
];

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // All localStorage state — loaded in useEffect only
  const [curatedIds, setCuratedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [userIntent, setUserIntent] = useState<any>(null);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  // Load localStorage once on client
  useEffect(() => {
    const intent = storage.get<any>(STORAGE_KEYS.USER_INTENT, null);
    const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
    const saved = storage.get<string[]>(STORAGE_KEYS.SAVED_IDS, []);
    const compareItems = storage.get<Project[]>(STORAGE_KEYS.COMPARE_ITEMS, []);

    setUserIntent(intent);
    setCuratedIds(curated);
    setSavedIds(saved);
    setCompareIds(compareItems.map(p => p.id));
    setHasPreferences(!!intent);
  }, []);

  // Sync compareIds when CompareBar changes
  useEffect(() => {
    const handler = () => {
      const items = storage.get<Project[]>(STORAGE_KEYS.COMPARE_ITEMS, []);
      setCompareIds(items.map(p => p.id));
    };
    window.addEventListener('compareUpdated', handler);
    return () => window.removeEventListener('compareUpdated', handler);
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch projects
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

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.builderName || '').toLowerCase().includes(q)
      );
    }

    // Risk filter (only if project has riskLabel)
    if (riskFilter !== 'all') {
      result = result.filter(p => (p as any).riskLabel === riskFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(p => {
        const types = (p.unitConfigs || []).map(u => (u.type || '').toLowerCase());
        if (typeFilter === 'apartment') return types.some(t =>
          /^\d/.test(t) || t.includes('bhk') || t.includes('studio') || t.includes('rk')
        );
        if (typeFilter === 'villa') return types.some(t =>
          t.includes('villa') || t.includes('row house')
        );
        if (typeFilter === 'plot') return types.some(t => t.includes('plot'));
        return true;
      });
    }

    // Budget filter
    if (budgetFilter !== 'all') {
      const ranges: Record<string, [number, number]> = {
        'under-50':  [0,          5000000],
        '50-1cr':    [5000000,    10000000],
        '1cr-2cr':   [10000000,   20000000],
        '2cr-plus':  [20000000,   Infinity],
      };
      const [min, max] = ranges[budgetFilter] || [0, Infinity];
      result = result.filter(p => {
        const prices = (p.unitConfigs || []).map(u => u.priceMin).filter(Boolean);
        if (prices.length === 0) return true;
        const pMin = Math.min(...prices);
        return pMin >= min && pMin <= max;
      });
    }

    // Preference-based filtering (if user has intent and hasn't chosen "show all")
    if (!showAllProjects && userIntent) {
      const scored = result
        .map(p => ({ project: p, score: scoreByIntent(p, userIntent) }))
        .filter(x => x.score >= 0);
      result = scored.map(x => x.project);

      // Default sort for relevance mode
      if (sortBy === 'relevance') {
        const scoreMap = new Map(scored.map(x => [x.project.id, x.score]));
        result.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
      }
    }

    // Explicit sort (overrides relevance)
    if (sortBy === 'price_asc') {
      result.sort((a, b) =>
        (a.unitConfigs?.[0]?.priceMin || 0) - (b.unitConfigs?.[0]?.priceMin || 0)
      );
    }
    if (sortBy === 'price_desc') {
      result.sort((a, b) =>
        (b.unitConfigs?.[0]?.priceMin || 0) - (a.unitConfigs?.[0]?.priceMin || 0)
      );
    }
    if (sortBy === 'newest') {
      result.sort((a, b) =>
        new Date(b.launchDate || 0).getTime() - new Date(a.launchDate || 0).getTime()
      );
    }

    setFiltered(result);
    if (result.length > 0 && !result.find(p => p.id === selectedProject?.id)) {
      setSelectedProject(result[0]);
    }
  }, [projects, searchQuery, sortBy, typeFilter, budgetFilter,
      riskFilter, userIntent, showAllProjects]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const toggleCurated = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const next = curatedIds.includes(id)
      ? curatedIds.filter(i => i !== id)
      : [...curatedIds, id];
    setCuratedIds(next);
    storage.set(STORAGE_KEYS.CURATED_IDS, next);
    window.dispatchEvent(new Event('curatedUpdated'));
    toast(next.includes(id) ? 'Added to Dashboard ⭐' : 'Removed from Dashboard');
  };

  const toggleSaved = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const next = savedIds.includes(id)
      ? savedIds.filter(i => i !== id)
      : [...savedIds, id];
    setSavedIds(next);
    storage.set(STORAGE_KEYS.SAVED_IDS, next);
    toast(next.includes(id) ? 'Saved ❤️' : 'Removed from saved');
  };

  const handleCompare = (project: Project, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    addToCompare(project);
    const items = storage.get<Project[]>(STORAGE_KEYS.COMPARE_ITEMS, []);
    setCompareIds(items.map(p => p.id));
    toast(items.find(p => p.id === project.id) ? 'Added to compare' : 'Removed from compare');
  };

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy)!;
  const activeFilterCount = [
    riskFilter !== 'all', typeFilter !== 'all', budgetFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-40">

      {/* Search + filter bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 space-y-3">

          {/* Preference banner */}
          {hasPreferences && !showAllProjects && (
            <div className="flex items-center gap-2 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <p className="text-xs font-semibold text-[var(--primary)]">
                Showing projects matching your preferences
              </p>
              <button
                onClick={() => setShowAllProjects(true)}
                className="ml-1 text-xs font-bold text-[var(--primary)] underline"
              >
                Show all
              </button>
            </div>
          )}
          {showAllProjects && (
            <div className="flex items-center gap-2 py-1.5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                Showing all projects
              </p>
              <button
                onClick={() => setShowAllProjects(false)}
                className="ml-1 text-xs font-bold text-[var(--primary)] underline"
              >
                Apply my preferences
              </button>
            </div>
          )}

          {/* Row 1: search + controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search project, area, builder..."
                className="w-full pl-9 pr-8 py-2.5 bg-[var(--surface-raised)]
                  border border-[var(--border)] rounded-[var(--radius-xs)] text-sm
                  text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:border-[var(--primary)]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-xs)]
                border text-sm font-semibold transition-colors flex-shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)]'
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--primary)]
                  text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Custom sort dropdown */}
            <div ref={sortRef} className="relative flex-shrink-0">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className={`flex items-center gap-2 pl-3 pr-2.5 py-2.5
                  bg-[var(--surface-raised)] border rounded-[var(--radius-xs)]
                  text-sm font-semibold transition-all whitespace-nowrap ${
                  sortOpen
                    ? 'border-[var(--primary)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}>
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
                    className="absolute right-0 top-[calc(100%+6px)] z-50 w-52
                      bg-white border border-[var(--border)] rounded-[var(--radius)]
                      shadow-[var(--shadow-lg)] overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                        Sort by
                      </p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value}
                          onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5
                            rounded-[var(--radius-xs)] text-sm font-semibold transition-all text-left ${
                            sortBy === opt.value
                              ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
                          }`}>
                          <span className="text-base w-5 text-center">{opt.icon}</span>
                          <span className="flex-1">{opt.label}</span>
                          {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View mode — desktop */}
            <div className="hidden sm:flex items-center bg-[var(--surface-raised)]
              rounded-[var(--radius-xs)] p-0.5">
              <button onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable filter row */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pb-2 flex flex-wrap gap-4">
                  {/* Type */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                      Type
                    </span>
                    {['all', 'apartment', 'villa', 'plot'].map(t => (
                      <button key={t} onClick={() => setTypeFilter(t)}
                        className={`min-w-[68px] text-center px-3 py-1 rounded-full text-xs font-bold capitalize transition-all border ${
                          typeFilter === t
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}>{t === 'all' ? 'All Types' : t}</button>
                    ))}
                  </div>
                  {/* Budget */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                      Budget
                    </span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'under-50', label: 'Under ₹50L' },
                      { id: '50-1cr', label: '₹50L–1Cr' },
                      { id: '1cr-2cr', label: '₹1Cr–2Cr' },
                      { id: '2cr-plus', label: '₹2Cr+' },
                    ].map(b => (
                      <button key={b.id} onClick={() => setBudgetFilter(b.id)}
                        className={`min-w-[72px] text-center px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                          budgetFilter === b.id
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}>{b.label}</button>
                    ))}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setRiskFilter('all'); setTypeFilter('all'); setBudgetFilter('all');
                      }}
                      className="text-xs font-bold text-[var(--danger)] hover:underline ml-auto">
                      Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result count */}
          <p className="text-xs text-[var(--text-muted)] font-medium">
            {isLoading ? 'Loading...' : `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
            {!showAllProjects && hasPreferences ? ' matching your preferences' : ''}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-[360px] rounded-[var(--radius)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <Search className="w-12 h-12 text-[var(--text-muted)]" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">No projects found</h3>
            <button
              onClick={() => {
                setSearchQuery(''); setTypeFilter('all');
                setBudgetFilter('all'); setRiskFilter('all');
                setShowAllProjects(true);
              }}
              className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)] text-sm">
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
                {/* Action overlay */}
                <div className="absolute top-12 left-3 flex flex-col gap-1.5 z-10
                  opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => toggleCurated(project.id, e)}
                    title={curatedIds.includes(project.id) ? 'Remove from Dashboard' : 'Add to Dashboard'}
                    className={`p-2 rounded-full shadow-md transition-all backdrop-blur-sm ${
                      curatedIds.includes(project.id)
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-white/90 text-[var(--text-muted)] hover:text-[var(--primary)]'
                    }`}>
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => toggleSaved(project.id, e)}
                    title={savedIds.includes(project.id) ? 'Unsave' : 'Save'}
                    className={`p-2 rounded-full shadow-md transition-all backdrop-blur-sm ${
                      savedIds.includes(project.id)
                        ? 'bg-[var(--danger)] text-white'
                        : 'bg-white/90 text-[var(--text-muted)] hover:text-[var(--danger)]'
                    }`}>
                    <Star className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // LIST VIEW
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
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-[var(--text-primary)] line-clamp-1"
                            style={{ fontFamily: 'var(--font-display)' }}>
                            {project.name}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            {project.location}, {project.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-black text-[var(--primary)]">
                          {formatINR(minPrice)}
                        </span>
                        {configs.slice(0, 3).map(c => (
                          <span key={c} className="text-[10px] font-bold px-2 py-0.5
                            bg-[var(--surface-raised)] border border-[var(--border)]
                            rounded-full text-[var(--text-secondary)]">{c}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        {project.reraId && (
                          <span className="flex items-center gap-1 text-[var(--success)] font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> RERA
                          </span>
                        )}
                        <span>{project.constructionStatus?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </Link>
                  {/* Actions — outside Link */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleCurated(project.id, e); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-xs)]
                        font-bold text-[10px] transition-all border ${
                        curatedIds.includes(project.id)
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline whitespace-nowrap">
                        {curatedIds.includes(project.id) ? 'Added ✓' : 'Dashboard'}
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
