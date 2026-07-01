'use client';

import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Project, UnitConfig } from "@/types/project";
const GallerySlider = dynamic(() => import("@/components/property/GallerySlider"), {
  ssr: false,
  loading: () => <div className="aspect-[4/3] w-full bg-[var(--surface-raised)] animate-pulse rounded-[var(--radius)]" />,
});
import InsightsPanel from "@/components/property/InsightsPanel";
import AmenityGrid from "@/components/property/AmenityGrid";
import LocationSection from "@/components/map/LocationSection";
import UnitConfigCard from "@/components/property/UnitConfigCard";
import ConsultationCTA from "@/components/conversion/ConsultationCTA";
import LeadQualificationSheet from "@/components/conversion/LeadQualificationSheet";
import AskAIModal from "@/components/ai/AskAIModal";
import PageLoader from "@/components/ui/PageLoader";
import { useGuestMode } from "@/hooks/useGuestMode";
import { GUEST_LIMITS } from "@/lib/guest-config";
import GuestGate from "@/components/ui/GuestGate";
import { formatINR } from "@/lib/finance-calculations";
import { SHOW_BUILDER_SCORE } from "@/lib/feature-flags";
import {
  MapPin, Share2, Heart, ShieldCheck, Download, Sparkles,
  Play, ChevronRight, CheckCircle2, XCircle, X, ZoomIn,
  Building2, Home, CalendarDays, Layers, ArrowLeft, LayoutDashboard, Lock
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import TimelineSection from "@/components/property/TimelineSection";

// ── Tab definitions ────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'location',     label: 'Location' },
  { id: 'amenities',    label: 'Amenities' },
  { id: 'floor-plans',  label: 'Floor Plans' },
  { id: 'pricing',      label: 'Pricing' },
  { id: 'pros-cons',    label: 'Pros & Cons' },
  { id: 'legal',        label: 'Legal' },
  { id: 'rera',         label: 'RERA' },
  { id: 'builder',      label: 'Builder' },
];

// ── Construction status display ────────────────────────────
function constructionLabel(status: string, percent: number): string {
  if (status === 'ready_to_move') return 'Ready to Move'
  if (status === 'pre_launch') return 'Pre Launch'
  if (status === 'new_launch') return 'New Launch (3+ yrs)'
  return `Under Construction (${percent}%)`
}

function possessionLabel(possessionDate: string): string {
  const now = new Date()
  const d = new Date(possessionDate)
  const months = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
  if (months <= 0) return 'Ready to Move'
  if (months <= 12) return 'Within 1 Year'
  if (months <= 24) return '1-2 Years'
  if (months <= 60) return '3-5 Years'
  return '5+ Years'
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { isGuest: isGuestRaw, isChecking } = useGuestMode();
  const isGuest = !isChecking && isGuestRaw;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isQualificationOpen, setIsQualificationOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitConfig | undefined>();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeVideo, setActiveVideo] = useState(0);
  const [expandedEMIRow, setExpandedEMIRow] = useState<string | null>(null);
  const [emiRate, setEmiRate] = useState(8.5);
  const [emiTenure, setEmiTenure] = useState(20);
  const [expandedFloorPlan, setExpandedFloorPlan] = useState<{ src: string; label: string } | null>(null);
  const [activePricingType, setActivePricingType] = useState('');
  const [savedToShortlist, setSavedToShortlist] = useState(false);
  const [addedToDashboard, setAddedToDashboard] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActivePricingType('');
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) throw new Error('Not found');
        setProject(await res.json());
      } catch {
        setProject(null);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();

    const openSheet = (e: any) => {
      setSelectedUnit(e.detail?.unitConfig);
      setIsQualificationOpen(true);
    };
    window.addEventListener('open-qualification-sheet', openSheet);
    window.addEventListener('open-ai-modal', () => setIsAIModalOpen(true));
    return () => {
      window.removeEventListener('open-qualification-sheet', openSheet);
      window.removeEventListener('open-ai-modal', () => setIsAIModalOpen(true));
    };
  }, [slug]);

  useEffect(() => {
    if (project) {
      const saved = storage.get<string[]>(STORAGE_KEYS.SAVED_IDS, []);
      setSavedToShortlist(saved.includes(project.id));
      const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
      setAddedToDashboard(curated.includes(project.id));
      if (pricingTypeGroups.length > 0) {
        setActivePricingType(pricingTypeGroups[0][0]); // Bug 5 fixed: always reset on project change
      }
    }
  }, [project]);

  const handleTabClick = (tabId: string) => {
    if (isGuest && GUEST_LIMITS.project.lockedTabs.includes(tabId as any)) {
      toast('Sign up to access full project details', {
        action: { label: 'Get Started', onClick: () => router.push('/onboarding') }
      });
      return;
    }
    setActiveTab(tabId);
    const el = document.getElementById(`section-${tabId}`);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    const tabEl = tabsRef.current?.querySelector(`[data-tab="${tabId}"]`);
    tabEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const syncSaveToSupabase = async (projectId: string, isSaving: boolean) => {
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isSaving) {
        await supabase.from('saved_projects').upsert(
          { user_id: user.id, project_id: projectId },
          { onConflict: 'user_id,project_id' }
        );
      } else {
        await supabase.from('saved_projects')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', projectId);
      }
    } catch {
      // Non-critical — localStorage already updated
    }
  };

  const handleSaveToShortlist = () => {
    if (!project) return;
    if (isGuest) {
      toast('Sign up to save projects', {
        action: { label: 'Get Started', onClick: () => router.push('/onboarding') }
      });
      return;
    }
    const saved = storage.get<string[]>(STORAGE_KEYS.SAVED_IDS, []);
    const isAlready = saved.includes(project.id);
    const next = isAlready ? saved.filter(id => id !== project.id) : [...saved, project.id];
    storage.set(STORAGE_KEYS.SAVED_IDS, next);
    setSavedToShortlist(!isAlready);
    syncSaveToSupabase(project.id, !isAlready);
    toast(isAlready ? 'Removed from shortlist' : 'Saved to shortlist ❤️');
  };

  const handleAddToDashboard = () => {
    if (!project) return;
    if (isGuest) {
      toast('Sign up to save projects to your Dashboard', {
        action: { label: 'Get Started', onClick: () => router.push('/onboarding') }
      });
      return;
    }
    const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
    const isAlready = curated.includes(project.id);
    const next = isAlready
      ? curated.filter(id => id !== project.id)
      : [...curated, project.id];
    storage.set(STORAGE_KEYS.CURATED_IDS, next);
    setAddedToDashboard(!isAlready);

    if (!isAlready) {
      const rejected = storage.get<string[]>(STORAGE_KEYS.REJECTED_IDS, []);
      if (rejected.includes(project.id)) {
        storage.set(STORAGE_KEYS.REJECTED_IDS, rejected.filter(rid => rid !== project.id));
      }
    }

    window.dispatchEvent(new Event('curatedUpdated'));
    toast(!isAlready ? 'Added to Dashboard ⭐' : 'Removed from Dashboard');
  };

  const pricingTypeGroups = React.useMemo(() => {
    if (!project?.unitConfigs?.length) return [] as [string, any[]][];
    return Array.from(
      project!.unitConfigs.reduce((map, unit) => {
        const base = unit.type.match(/^(\d+(?:\.\d+)?(?:\s*BHK|RK)?)/i)?.[0]?.trim() || unit.type.split(/[-–(]/)[0].trim();
        if (!map.has(base)) map.set(base, []);
        map.get(base)!.push(unit);
        return map;
      }, new Map<string, any[]>())
    );
  }, [project?.unitConfigs]);

  function calcEMI(principal: number, rate: number, tenureYears: number): number {
    if (!principal || !rate || !tenureYears) return 0;
    const r = rate / 12 / 100;
    const n = tenureYears * 12;
    return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }

  // ── PlanImageGallery inline component ────────────────────
  function PlanImageGallery({
    images,
    labels,
    label,
  }: {
    images: string[];
    labels?: string[];
    label: string;
  }) {
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

    return (
      <>
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)}
            >
              <motion.div
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.92 }}
                className="relative max-w-3xl w-full bg-white rounded-[var(--radius-lg)] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                  <p className="font-black text-[var(--text-primary)] text-sm">
                    {labels?.[lightboxIndex] ?? label}
                    <span className="ml-2 text-[var(--text-muted)] font-normal text-xs">
                      {lightboxIndex + 1} / {images.length}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setLightboxIndex(i => i! > 0 ? i! - 1 : images.length - 1)}
                          className="p-2 hover:bg-[var(--surface-raised)] rounded-full text-[var(--text-secondary)]"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          onClick={() => setLightboxIndex(i => i! < images.length - 1 ? i! + 1 : 0)}
                          className="p-2 hover:bg-[var(--surface-raised)] rounded-full text-[var(--text-secondary)]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setLightboxIndex(null)}
                      className="p-2 hover:bg-[var(--surface-raised)] rounded-full"
                    >
                      <X className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-raised)]">
                  <img
                    src={images[lightboxIndex]}
                    alt={labels?.[lightboxIndex] ?? label}
                    className="w-full h-auto max-h-[70vh] object-contain rounded-[var(--radius-xs)]"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-52 h-40 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius-sm)] overflow-hidden cursor-pointer group relative"
              onClick={() => setLightboxIndex(idx)}
            >
              <img
                src={img}
                alt={labels?.[idx] ?? `${label} ${idx + 1}`}
                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors
                flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity
                  flex items-center gap-1.5 bg-white/90 text-[var(--text-primary)]
                  px-2.5 py-1 rounded-full text-[10px] font-bold shadow">
                  <ZoomIn className="w-3 h-3" /> Enlarge
                </div>
              </div>
              {labels?.[idx] && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold
                  px-2 py-1 truncate">
                  {labels[idx]}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (isLoading) return <PageLoader />;
  if (!isLoading && notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="text-5xl">🏗️</div>
        <h2 className="text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Project not found
        </h2>
        <p className="text-[var(--text-secondary)] max-w-sm">
          This project may have been removed or the link is incorrect.
        </p>
        <Link href="/explore" className="px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]">
          Browse Projects
        </Link>
      </div>
    );
  }
  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="text-6xl">🏗️</div>
      <h2 className="text-2xl font-black text-[var(--text-primary)]">Project not found</h2>
      <Link href="/explore"
        className="px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]">
        Browse Projects
      </Link>
    </div>
  );

  const minPrice = project.unitConfigs?.length
    ? Math.min(...project.unitConfigs.map(u => u.price)) : 0;
  const maxPrice = project.unitConfigs?.length
    ? Math.max(...project.unitConfigs.map(u => u.price)) : 0;
  const configSummary = Array.from(new Set(project.unitConfigs.map(u =>
    u.type.match(/^(\d+(?:\.\d+)?(?:\s*BHK|RK)?)/i)?.[0] || u.type
  ))).join(', ');
  const areaMin = project.unitConfigs?.length ? Math.min(...project.unitConfigs.map(u => u.area)) : 0;
  const areaMax = project.unitConfigs?.length ? Math.max(...project.unitConfigs.map(u => u.area)) : 0;

  const formatReraStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name,
    description: project.description,
    url: `https://propcinity.com/projects/${project.slug}`,
    image: project.images?.[0],
    address: {
      '@type': 'PostalAddress',
      addressLocality: project.city,
      addressCountry: 'IN',
      streetAddress: project.location,
    },
    offers: project.unitConfigs.map(u => ({
      '@type': 'Offer',
      name: u.type,
      price: u.price,
      priceCurrency: 'INR',
    })),
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Mobile top bar ─────────────────────────────── */}
      <div className="lg:hidden px-4 py-3 flex justify-between items-center
        border-b border-[var(--border)] bg-white sticky top-0 z-40">
        <button onClick={() => router.back()}
          className="p-1.5 text-[var(--text-secondary)]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="font-bold text-[var(--text-primary)] text-sm truncate mx-3 flex-1">
          {project.name}
        </p>
        <div className="flex gap-2">
          <button onClick={() => navigator.share?.({ title: project.name, url: window.location.href }).catch(() => {})}
            className="p-1.5 text-[var(--text-secondary)]">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={handleAddToDashboard}
            className={`p-1.5 transition-colors ${
              addedToDashboard ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
            }`}
            title={addedToDashboard ? 'Remove from Dashboard' : 'Add to Dashboard'}
          >
            <LayoutDashboard className={`w-5 h-5`} />
          </button>
        </div>
      </div>

      {/* ── Gallery ────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 lg:pt-8">
        <GallerySlider images={project.images} />
      </div>

      {/* ── Sticky tabs ────────────────────────────────── */}
      <div className="sticky top-0 lg:top-16 z-30 bg-white border-b border-[var(--border)] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div ref={tabsRef}
            className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const isLocked = isGuest && GUEST_LIMITS.project.lockedTabs.includes(tab.id as any);
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex-shrink-0 px-4 py-3.5 text-xs font-bold uppercase tracking-wider
                    border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  } ${isLocked ? 'opacity-60' : ''}`}
                >
                  {tab.label}
                  {isLocked && <Lock className="w-3 h-3 ml-1 inline-block" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* ── LEFT: all sections ────────────────────── */}
          <div className="lg:col-span-2 space-y-0">

            {/* ── OVERVIEW ─────────────────────────────── */}
            <div id="section-overview" className="scroll-mt-36 pb-10 border-b border-[var(--border)]">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-4">
                <Link href="/" className="hover:text-[var(--primary)]">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/explore" className="hover:text-[var(--primary)]">{project.city}</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[var(--text-primary)]">{project.name}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mb-1"
                style={{ fontFamily: 'var(--font-display)' }}>
                {project.name}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5 mb-2">
                By <Link href="#section-builder"
                  className="text-[var(--primary)] font-semibold hover:underline">
                  {project.builderName}
                </Link>
              </p>
              <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mb-4">
                <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                {project.location}, {project.city}
              </p>

              {/* Price */}
              <div className="mb-6">
                <p className="text-xl sm:text-2xl font-black text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {formatINR(minPrice)}
                  {maxPrice > minPrice && ` - ${formatINR(maxPrice)}`}
                  <span className="text-sm font-normal text-[var(--text-muted)] ml-2">All inclusive</span>
                </p>
              </div>

              {/* Overview grid */}
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}>
                {project.name} Overview
              </h2>

              {project.brochureUrl && (
                <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary-light)]
                    text-[var(--primary)] text-sm font-bold rounded-[var(--radius-xs)] mb-5
                    hover:bg-[var(--primary)] hover:text-white transition-colors">
                  <Download className="w-4 h-4" /> Brochure
                </a>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Home, label: 'Land Parcel', value: project.landParcelAcres ? `${project.landParcelAcres} acres` : 'N/A' },
                  { icon: Building2, label: 'Towers', value: project.totalTowers ? String(project.totalTowers) : 'N/A' },
                  { icon: Layers, label: 'Floors', value: project.floorsPerTower || 'N/A' },
                  { icon: Home, label: 'Config', value: configSummary || 'N/A' },
                  { icon: Home, label: 'Carpet Area', value: areaMin ? `${areaMin}-${areaMax} sqft` : 'N/A' },
                  {
                    icon: ShieldCheck,
                    label: 'RERA Status',
                    value: formatReraStatus(project.reraStatus || 'not_registered'),
                  },
                  { icon: CalendarDays, label: 'Possession', value: constructionLabel(project.constructionStatus, project.constructionPercent) },
                  { icon: CalendarDays, label: 'Target Possession', value: project.possessionDate ? new Date(project.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A' },
                  { icon: CalendarDays, label: 'RERA Possession', value: project.reraPossessionDate ? new Date(project.reraPossessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A' },
                  { icon: ShieldCheck, label: 'Litigation', value: project.litigation ? 'Yes' : 'No' },
                ].map(item => (
                  <div key={item.label}
                    className="bg-[var(--surface-raised)] border border-[var(--border)]
                      rounded-[var(--radius-sm)] p-3 space-y-2">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* About */}
              <h3 className="text-base font-black text-[var(--text-primary)] mb-3">
                About {project.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>

            {/* ── LOCATION ─────────────────────────────── */}
            <div id="section-location" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}>
                {project.name} Location
              </h2>
              <LocationSection
                lat={project.lat}
                lng={project.lng}
                projectName={project.name}
                priceLabel={formatINR(minPrice)}
                location={project.location}
                city={project.city}
                nearbyLocations={project.nearbyLocations}
              />
            </div>

            {/* ── AMENITIES ──────────────────────────── */}
            {((project.internalAmenities?.length || project.externalAmenities?.length || project.amenities?.length)) && (
              <div id="section-amenities" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
                <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {project.name} Amenities
                </h2>
                <AmenityGrid
                  internalAmenities={project.internalAmenities}
                  externalAmenities={project.externalAmenities}
                  amenities={project.amenities}
                />
              </div>
            )}

            {/* ── FLOOR PLANS ──────────────────────────── */}
            <div id="section-floor-plans" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                Master & Floor Plans
              </h2>
              <GuestGate
                isGuest={isGuest}
                label="Sign up to view floor plans for this project"
                blur={true}
              >
                {/* Master Plan sub-section */}
                <div className="mb-8">
                  <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">
                    Master Plan
                  </h3>
                  {project.masterPlanImages && project.masterPlanImages.length > 0 ? (
                    <PlanImageGallery images={project.masterPlanImages} label="Master Plan" />
                  ) : (
                    <div className="h-32 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
                      <div className="w-10 h-10 bg-[var(--border)] rounded-lg flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Master Plan TBA</p>
                    </div>
                  )}
                </div>

                {/* Floor Plans sub-section — project-level images only */}
                <div>
                  <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">
                    Floor Plans
                  </h3>
                  {(() => {
                    const projectFloorPlans = project.floorPlanImages || [];

                    if (!projectFloorPlans.length) {
                      return (
                        <div className="h-32 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
                          <div className="w-10 h-10 bg-[var(--border)] rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5" />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-wider">Floor Plans TBA</p>
                        </div>
                      );
                    }

                    return <PlanImageGallery images={projectFloorPlans} label="Floor Plan" />;
                  })()}
                </div>
              </GuestGate>
            </div>

            {/* ── PRICING ──────────────────────────────── */}
            <div id="section-pricing" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                Pricing & Unit Plans
              </h2>
              <GuestGate
                isGuest={isGuest}
                label="Sign up to see detailed pricing & unit plans"
                blur={true}
              >
                {(() => {
                  const typeGroups = pricingTypeGroups;
                  const activeUnits = typeGroups.find(([key]) => key === activePricingType)?.[1]
                    || typeGroups[0]?.[1] || [];

                  return (
                    <div className="space-y-4">
                      {/* BHK type tabs */}
                      {typeGroups.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                          {typeGroups.map(([base]) => (
                            <button key={base} onClick={() => setActivePricingType(base)}
                              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                activePricingType === base
                                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                  : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                              }`}>
                              {base}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Table */}
                      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                              {['Carpet Area', 'All Inc. Price', 'Min Downpayment', 'Parking', 'Unit Plan'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {activeUnits.map(unit => {
                              const downpayment = Math.round(unit.price * 0.15);
                              const isExpanded = expandedEMIRow === unit.id && !isGuest;
                              return (
                                <React.Fragment key={unit.id}>
                                  <tr className="hover:bg-[var(--surface-raised)]/50 transition-colors align-top">
                                    {/* Carpet Area */}
                                    <td className="px-4 py-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                                      {unit.area} sqft
                                    </td>
                                    {/* All Inc. Price */}
                                    <td className="px-4 py-3 font-bold text-[var(--primary)] whitespace-nowrap">
                                      {formatINR(unit.price)}
                                      {unit.priceIsPlus && <span className="text-[var(--text-muted)] font-normal"> +</span>}
                                    </td>
                                    {/* Min Downpayment + EMI button */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[var(--text-secondary)] font-medium">{formatINR(downpayment)}</span>
                                        <button
                                          onClick={() => setExpandedEMIRow(isExpanded ? null : unit.id)}
                                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all uppercase tracking-wider ${
                                            isExpanded
                                              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                              : 'bg-[var(--surface-raised)] text-[var(--primary)] border-[var(--primary)]/40 hover:bg-[var(--primary)] hover:text-white'
                                          }`}
                                        >
                                          EMI <ChevronRight className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                      </div>
                                    </td>
                                    {/* Parking */}
                                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                                      {unit.parking != null ? (
                                        <span className="flex items-center gap-1.5 text-sm font-medium">
                                          🚗 {unit.parking}
                                        </span>
                                      ) : (
                                        <span className="text-[var(--text-muted)] text-xs">—</span>
                                      )}
                                    </td>
                                    {/* Unit Plan thumbnail */}
                                    <td className="px-4 py-3">
                                      {unit.floorPlan ? (
                                        <button
                                          onClick={() => {
                                            setExpandedFloorPlan({ src: unit.floorPlan!, label: `${unit.type} · ${unit.area} sqft` });
                                          }}
                                          className="w-14 h-14 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg
                                            overflow-hidden group relative hover:border-[var(--primary)] transition-colors"
                                        >
                                          <img src={unit.floorPlan} alt="unit plan"
                                            className="w-full h-full object-contain p-1" />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors
                                            flex items-center justify-center">
                                            <ZoomIn className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </button>
                                      ) : (
                                        <span className="text-[var(--text-muted)] text-xs">—</span>
                                      )}
                                    </td>
                                  </tr>
                                  {/* EMI calculator row */}
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={5} className="px-4 pb-4 bg-[var(--surface-raised)]/40">
                                        <div className="p-4 bg-white border border-[var(--border)] rounded-[var(--radius-sm)] space-y-3 mt-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">EMI Calculator</p>
                                            <p className="text-lg font-black text-[var(--primary)]">
                                              {formatINR(calcEMI(unit.price * 0.85, emiRate, emiTenure))}/mo
                                            </p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                              <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold">
                                                <span>Interest Rate</span><span>{emiRate}%</span>
                                              </div>
                                              <input type="range" min={6.5} max={14} step={0.25}
                                                value={emiRate} onChange={e => setEmiRate(Number(e.target.value))}
                                                className="w-full h-1.5 accent-[var(--primary)] cursor-pointer rounded-full" />
                                            </div>
                                            <div className="space-y-1">
                                              <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold">
                                                <span>Tenure</span><span>{emiTenure} yrs</span>
                                              </div>
                                              <input type="range" min={5} max={30} step={1}
                                                value={emiTenure} onChange={e => setEmiTenure(Number(e.target.value))}
                                                className="w-full h-1.5 accent-[var(--primary)] cursor-pointer rounded-full" />
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-3 gap-2 pt-1">
                                            {[
                                              { label: 'Loan Amount', value: formatINR(Math.round(unit.price * 0.85)) },
                                              { label: 'Down Payment', value: formatINR(Math.round(unit.price * 0.15)) },
                                              { label: 'Total Interest', value: formatINR(Math.max(0, calcEMI(unit.price * 0.85, emiRate, emiTenure) * emiTenure * 12 - Math.round(unit.price * 0.85))) },
                                            ].map(item => (
                                              <div key={item.label} className="bg-[var(--surface-raised)] p-2 rounded-[var(--radius-xs)]">
                                                <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold">{item.label}</p>
                                                <p className="text-xs font-bold text-[var(--text-primary)]">{item.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                          <p className="text-[9px] text-[var(--text-muted)] italic">
                                            * Estimate only. 85% loan assumed. Actual terms may vary.
                                          </p>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </GuestGate>
            </div>

            {/* ── PROS & CONS ───────────────────────── */}
            {((project.pros && project.pros.length > 0) || (project.cons && project.cons.length > 0)) && (
              <div id="section-pros-cons" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
                <h2
                  className="text-lg font-black text-[var(--text-primary)] mb-6"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Pros & Cons
                </h2>
                <GuestGate
                  isGuest={isGuest}
                  label="Sign up to see honest pros & cons for this project"
                  blur={true}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Pros */}
                    {project.pros && project.pros.length > 0 && (
                      <div className="bg-[var(--success-light)] border border-[var(--success)]/20 rounded-[var(--radius)] p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-[var(--success)] flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h3 className="text-xs font-black text-[var(--success)] uppercase tracking-widest">
                            Pros
                          </h3>
                        </div>
                        <ul className="space-y-2.5">
                          {project.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-[var(--text-secondary)] leading-snug">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Cons */}
                    {project.cons && project.cons.length > 0 && (
                      <div className="bg-[var(--danger-light)] border border-[var(--danger)]/20 rounded-[var(--radius)] p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-[var(--danger)] flex items-center justify-center flex-shrink-0">
                            <XCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h3 className="text-xs font-black text-[var(--danger)] uppercase tracking-widest">
                            Cons
                          </h3>
                        </div>
                        <ul className="space-y-2.5">
                          {project.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <XCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-[var(--text-secondary)] leading-snug">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </GuestGate>
              </div>
            )}

            {/* ── LEGAL ────────────────────────────────── */}
            <div id="section-legal" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                Legal
              </h2>
              <GuestGate
                isGuest={isGuest}
                label="Sign up to view legal details"
                blur={true}
              >
                <div className={`flex items-start gap-4 p-5 rounded-[var(--radius-sm)] border ${
                  !project.litigation
                    ? 'bg-[var(--success-light)] border-[var(--success)]/20'
                    : 'bg-[var(--danger-light)] border-[var(--danger)]/20'
                }`}>
                  {!project.litigation
                    ? <CheckCircle2 className="w-6 h-6 text-[var(--success)] flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-6 h-6 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={`font-black text-base ${!project.litigation ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {!project.litigation
                        ? 'No Litigation'
                        : 'Litigation Exists'}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {project.litigation
                        ? (project.litigationDetails || 'This project has pending litigation. Verify with a legal expert before purchase.')
                        : 'There is no pending litigation on this project at the time of last verification.'}
                    </p>
                  </div>
                </div>
              </GuestGate>
            </div>

            {/* ── RERA ─────────────────────────────────── */}
            <div id="section-rera" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                RERA Registration
              </h2>
              <GuestGate
                isGuest={isGuest}
                label="Sign up to view RERA registration details"
                blur={true}
              >
                {(() => {
                  const regs = project.reraRegistrations?.length
                    ? project.reraRegistrations
                    : project.reraId
                      ? [{ id: 'legacy', reraId: project.reraId, reraLink: project.reraLink, description: undefined }]
                      : [];

                  if (regs.length === 0) {
                    return <p className="text-sm text-[var(--text-muted)] italic">RERA details not available.</p>;
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                      {regs.map(reg => (
                        <div key={reg.id} className="flex flex-col items-center gap-3 p-4
                          bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-sm)]">
                          {reg.reraLink ? (
                            <a href={reg.reraLink} target="_blank" rel="noopener noreferrer"
                              className="group flex flex-col items-center gap-1">
                              <div className="w-28 h-28 bg-white border border-[var(--border)] rounded-lg overflow-hidden
                                group-hover:shadow-md transition-shadow p-1.5">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(reg.reraLink)}&size=160x160&margin=0`}
                                  alt={`QR for ${reg.reraId}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <p className="text-[9px] text-[var(--primary)] font-bold group-hover:underline uppercase tracking-wider">
                                Scan / Click
                              </p>
                            </a>
                          ) : (
                            <div className="w-28 h-28 bg-[var(--border)] rounded-lg flex items-center justify-center">
                              <p className="text-[9px] text-[var(--text-muted)] text-center px-2">No RERA link</p>
                            </div>
                          )}
                          <div className="text-center">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                              RERA No.
                            </p>
                            <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5 break-all">
                              {reg.reraId}
                            </p>
                            {reg.description && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{reg.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </GuestGate>
            </div>

            {/* ── BANK APPROVALS ───────────────────────── */}
            {project.bankApprovals && project.bankApprovals.length > 0 && (
              <div className="py-10 border-b border-[var(--border)]">
                <h2 className="text-lg font-black text-[var(--text-primary)] mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  Bank Approvals
                </h2>
                <div className="flex flex-wrap gap-3">
                  {project.bankApprovals.map((bank, i) => (
                    <div key={i}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--border)]
                        rounded-[var(--radius-sm)] shadow-sm">
                      {bank.logoUrl
                        ? <img src={bank.logoUrl} alt={bank.bankName} className="h-6 object-contain" />
                        : <span className="text-sm font-bold text-[var(--text-primary)]">{bank.bankName}</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BUILDER ──────────────────────────────── */}
            <div id="section-builder" className="scroll-mt-36 py-10">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}>
                About {project.builderName}
              </h2>
              <GuestGate
                isGuest={isGuest}
                label="Sign up to see builder details & track record"
                blur={true}
              >
                <div className="p-5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)]">
                  <div className="flex items-center gap-4 mb-4">
                    {project.builderLogo && (
                      <img src={project.builderLogo} alt={project.builderName}
                        className="w-16 h-16 object-contain rounded-lg border border-[var(--border)] bg-white p-1" />
                    )}
                    <div>
                      <p className="font-black text-[var(--text-primary)] text-lg">{project.builderName}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {project.builderYearsExperience && (
                          <p className="text-xs text-[var(--text-muted)]">
                            {project.builderYearsExperience}+ years experience
                          </p>
                        )}
                        {project.builderCompletedProjects && (
                          <p className="text-xs text-[var(--text-muted)]">
                            {project.builderCompletedProjects}+ completed projects
                          </p>
                        )}
                      </div>
                    </div>
                    {SHOW_BUILDER_SCORE && project.builderScore !== undefined && (
                      <div className="relative w-14 h-14 flex items-center justify-center ml-auto flex-shrink-0">
                        <svg className="absolute" width="56" height="56" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
                          <circle
                            cx="28" cy="28" r="20" fill="none"
                            stroke={project.builderScore >= 75 ? '#22c55e' : project.builderScore >= 50 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="4"
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={(2 * Math.PI * 20) - (project.builderScore / 100) * (2 * Math.PI * 20)}
                            strokeLinecap="round" transform="rotate(-90 28 28)"
                          />
                        </svg>
                        <span
                          className="text-xs font-bold"
                          style={{ color: project.builderScore >= 75 ? '#22c55e' : project.builderScore >= 50 ? '#f59e0b' : '#ef4444' }}
                        >
                          {project.builderScore}
                        </span>
                      </div>
                    )}
                  </div>

                  {project.builderDescription && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                      {project.builderDescription}
                    </p>
                  )}

                  {project.builderTopProjects && project.builderTopProjects.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Notable Projects
                      </p>
                      <ul className="space-y-1">
                        {project.builderTopProjects.slice(0, 5).map((p, i) => (
                          <li key={i} className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[var(--primary)] flex-shrink-0" />
                            {p.name} — {p.location}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </GuestGate>
            </div>

          </div>

          {/* ── RIGHT: sticky CTA panel ───────────────── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-32 space-y-4">

              {/* Price + CTA */}
              <div className="p-5 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
                <div className="mb-4">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">
                    Starting From
                  </p>
                  <p className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    {formatINR(minPrice)}
                  </p>
                  {maxPrice > minPrice && (
                    <p className="text-xs text-[var(--text-muted)]">up to {formatINR(maxPrice)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 bg-[var(--success-light)]
                  rounded-[var(--radius-xs)] border border-[var(--success)]/20 mb-4">
                  <ShieldCheck className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                  <p className="text-xs font-bold text-[var(--success)]">
                    Zero Brokerage · Buy Direct From Builder
                  </p>
                </div>

                <ConsultationCTA project={project} variant="primary" triggerSource="project_detail_sidebar" />

                {/* Ask AI button */}
                <button
                  onClick={() => {
                    if (isGuest && GUEST_LIMITS.project.aiLocked) {
                      toast('Sign up to ask AI questions about this project', {
                        action: { label: 'Get Started', onClick: () => router.push('/onboarding') }
                      });
                      return;
                    }
                    setIsAIModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 mt-4 py-2.5
                    border border-[var(--primary)]/40 rounded-[var(--radius-xs)] text-sm
                    font-semibold text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask AI
                  {isGuest && <Lock className="w-3.5 h-3.5 ml-1" />}
                </button>
              </div>

              {/* Quick facts */}
              <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-sm)]">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Quick Facts
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Config', value: configSummary },
                    { label: 'Possession', value: possessionLabel(project.possessionDate) },
                    {
                      label: 'RERA Status',
                      value: formatReraStatus(project.reraStatus || 'not_registered')
                    },
                    { label: 'Litigation', value: project.litigation ? '⚠️ Yes' : '✓ No' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">{f.label}</span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share + Add to Dashboard */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.share?.({ title: project.name, url: window.location.href }).catch(() => {})}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                    border border-[var(--border)] rounded-[var(--radius-xs)] text-sm
                    font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={handleAddToDashboard}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5
                    border rounded-[var(--radius-xs)] text-sm font-semibold transition-colors ${
                    addedToDashboard
                      ? 'bg-[var(--primary-light)] border-[var(--primary)]/30 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}>
                  <LayoutDashboard className="w-4 h-4" />
                  {addedToDashboard ? 'Added ✓' : 'Add to Dashboard'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky bottom CTA ──────────────────── */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 z-30
        bg-white border-t border-[var(--border)] p-3 lg:hidden">
        <ConsultationCTA project={project} variant="sticky" triggerSource="project_detail_sticky" />
      </div>

      {/* Unit plan lightbox */}
      <AnimatePresence>
        {expandedFloorPlan && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExpandedFloorPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="relative max-w-2xl w-full bg-white rounded-[var(--radius-lg)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <p className="font-black text-[var(--text-primary)] text-sm">{expandedFloorPlan.label}</p>
                <button onClick={() => setExpandedFloorPlan(null)}
                  className="p-2 hover:bg-[var(--surface-raised)] rounded-full">
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
              <div className="p-4 bg-[var(--surface-raised)]">
                <img src={expandedFloorPlan.src} alt={expandedFloorPlan.label}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-[var(--radius-xs)]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ───────────────────────────────────── */}
      <LeadQualificationSheet
        isOpen={isQualificationOpen}
        onClose={() => setIsQualificationOpen(false)}
        project={project}
        unitConfig={selectedUnit}
      />
      <AskAIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        project={project}
      />
    </div>
  );
}
