'use client';

import { useEffect, useState, useRef } from "react";
import { Project, UnitConfig } from "@/types/project";
import GallerySlider from "@/components/property/GallerySlider";
import InsightsPanel from "@/components/property/InsightsPanel";
import AmenityGrid from "@/components/property/AmenityGrid";
import LocationSection from "@/components/map/LocationSection";
import UnitConfigCard from "@/components/property/UnitConfigCard";
import ConsultationCTA from "@/components/conversion/ConsultationCTA";
import LeadQualificationSheet from "@/components/conversion/LeadQualificationSheet";
import AskAIModal from "@/components/ai/AskAIModal";
import PageLoader from "@/components/ui/PageLoader";
import { formatINR } from "@/lib/finance-calculations";
import {
  MapPin, Share2, Heart, ShieldCheck, Download,
  Play, ChevronRight, CheckCircle2, XCircle,
  Building2, Home, CalendarDays, Layers, ArrowLeft
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Tab definitions ────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'pros-cons',    label: 'Pros & Cons' },
  { id: 'amenities',    label: 'Amenities' },
  { id: 'floor-plans',  label: 'Floor Plans' },
  { id: 'pricing',      label: 'Pricing' },
  { id: 'payment',      label: 'Payment' },
  { id: 'location',     label: 'Location' },
  { id: 'legal',        label: 'Legal' },
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
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQualificationOpen, setIsQualificationOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitConfig | undefined>();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeVideo, setActiveVideo] = useState(0);
  const [savedToShortlist, setSavedToShortlist] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) throw new Error('Not found');
        setProject(await res.json());
      } catch {
        setProject(null);
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

  const scrollToTab = (tabId: string) => {
    setActiveTab(tabId);
    const el = document.getElementById(`section-${tabId}`);
    if (el) {
      const offset = 120; // height of sticky header + tabs
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    // Scroll tab into view horizontally
    const tabEl = tabsRef.current?.querySelector(`[data-tab="${tabId}"]`);
    tabEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const handleSaveToShortlist = () => {
    if (!project) return;
    const saved: string[] = JSON.parse(localStorage.getItem('savedIds') || '[]');
    const isAlready = saved.includes(project.id);
    const next = isAlready ? saved.filter(id => id !== project.id) : [...saved, project.id];
    localStorage.setItem('savedIds', JSON.stringify(next));
    setSavedToShortlist(!isAlready);
    toast(isAlready ? 'Removed from shortlist' : 'Saved to shortlist ❤️');
  };

  if (isLoading) return <PageLoader />;
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
    ? Math.min(...project.unitConfigs.map(u => u.priceMin)) : 0;
  const maxPrice = project.unitConfigs?.length
    ? Math.max(...project.unitConfigs.map(u => u.priceMax)) : 0;
  const configSummary = Array.from(new Set(project.unitConfigs.map(u =>
    u.type.match(/^(\d+(?:\.\d+)?(?:\s*BHK|RK)?)/i)?.[0] || u.type
  ))).join(', ');
  const areaMin = project.unitConfigs?.length ? Math.min(...project.unitConfigs.map(u => u.area)) : 0;
  const areaMax = project.unitConfigs?.length ? Math.max(...project.unitConfigs.map(u => u.area)) : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">

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
          <button onClick={handleSaveToShortlist}
            className="p-1.5 text-[var(--text-secondary)]">
            <Heart className={`w-5 h-5 ${savedToShortlist ? 'fill-[var(--danger)] text-[var(--danger)]' : ''}`} />
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
            {TABS.map(tab => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => scrollToTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3.5 text-xs font-bold uppercase tracking-wider
                  border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
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

              {/* Overview grid — exactly like housiey */}
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
                  { icon: ShieldCheck, label: 'RERA NO.', value: project.reraId || 'N/A' },
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
              />
            </div>

            {/* ── VIDEOS ───────────────────────────────── */}
            {project.videos && project.videos.length > 0 && (
              <div className="py-10 border-b border-[var(--border)]">
                <h2 className="text-lg font-black text-[var(--text-primary)] mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {project.name} Videos
                </h2>
                {/* Tab selector */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                  {project.videos.map((v, i) => (
                    <button key={i} onClick={() => setActiveVideo(i)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold
                        border transition-all ${
                        activeVideo === i
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]'
                      }`}>
                      {v.label}
                    </button>
                  ))}
                </div>
                {/* Video embed */}
                <div className="aspect-video rounded-[var(--radius)] overflow-hidden bg-[var(--surface-raised)]">
                  <iframe
                    src={`https://www.youtube.com/embed/${project.videos[activeVideo].youtubeUrl.replace('https://youtu.be/', '').replace('https://www.youtube.com/watch?v=', '')}`}
                    className="w-full h-full"
                    allowFullScreen
                    title={project.videos[activeVideo].label}
                  />
                </div>
              </div>
            )}

            {/* ── PROS & CONS ──────────────────────────── */}
            <div id="section-pros-cons" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                {project.name} Pros & Cons
              </h2>
              <InsightsPanel pros={project.pros} cons={project.cons} variant="detail" />
            </div>

            {/* ── AMENITIES ────────────────────────────── */}
            <div id="section-amenities" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                {project.name} Amenities
              </h2>

              {/* Internal amenities if separate */}
              {project.internalAmenities && project.internalAmenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                    Internal Amenities
                  </h3>
                  <AmenityGrid amenities={project.internalAmenities} />
                </div>
              )}

              <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                {project.internalAmenities?.length ? 'External Amenities' : 'All Amenities'}
              </h3>
              <AmenityGrid amenities={project.externalAmenities || project.amenities} />
            </div>

            {/* ── FLOOR PLANS (unit configs with images) ── */}
            <div id="section-floor-plans" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                Master & Floor Plans
              </h2>
              <div className="space-y-6">
                {(() => {
                  const configs = project.unitConfigs || [];
                  const groups = new Map<string, typeof configs>();
                  configs.forEach(unit => {
                    const base = unit.type.split(/[-–(]/)[0].trim();
                    if (!groups.has(base)) groups.set(base, []);
                    groups.get(base)!.push(unit);
                  });
                  return Array.from(groups.entries()).map(([baseType, units]) => (
                    <div key={baseType}>
                      {units.length > 1 && (
                        <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-wider mb-3">
                          {baseType}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {units.map(unit => (
                          <UnitConfigCard key={unit.id} unit={unit} project={project} />
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* ── PRICING ──────────────────────────────── */}
            <div id="section-pricing" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                Pricing & Unit Plans
              </h2>
              <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                      <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Config</th>
                      <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Carpet Area</th>
                      <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Price/sqft</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {project.unitConfigs.map(unit => (
                      <tr key={unit.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{unit.type}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{unit.area} sqft</td>
                        <td className="px-4 py-3 font-bold text-[var(--primary)]">
                          {formatINR(unit.priceMin)}
                          {unit.priceMax > unit.priceMin && ` - ${formatINR(unit.priceMax)}`}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {formatINR(unit.pricePerSqFt)}/sqft
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── PAYMENT SCHEME ───────────────────────── */}
            <div id="section-payment" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                Payment Scheme
              </h2>
              {project.paymentPlans && project.paymentPlans.length > 0 ? (
                <div className="space-y-3">
                  {project.paymentPlans.map((plan, i) => (
                    <div key={i}
                      className="p-4 bg-[var(--surface-raised)] border border-[var(--border)]
                        rounded-[var(--radius-sm)]">
                      <p className="font-bold text-[var(--text-primary)] mb-1">{plan.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{plan.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)] italic">
                  Payment plans available on request. Contact our advisor for details.
                </p>
              )}
            </div>

            {/* ── LEGAL ────────────────────────────────── */}
            <div id="section-legal" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}>
                Legal
              </h2>
              <div className="space-y-3">
                {[
                  {
                    label: 'RERA Registered',
                    value: !!project.reraId,
                    detail: project.reraId || '',
                    link: project.reraLink,
                  },
                  {
                    label: 'Litigation',
                    value: !project.litigation,
                    detail: project.litigation
                      ? (project.litigationDetails || 'Has pending litigation — verify before purchase')
                      : 'No pending litigation on this project',
                    invertIcon: true,
                  },
                  {
                    label: 'Commencement Certificate',
                    value: project.commencementCertificate,
                    detail: project.commencementCertificate
                      ? 'CC issued — construction is legally authorised'
                      : 'CC not yet issued or not available',
                  },
                ].map(item => (
                  <div key={item.label}
                    className={`flex items-start gap-3 p-4 rounded-[var(--radius-sm)] border ${
                    item.value
                      ? 'bg-[var(--success-light)] border-[var(--success)]/20'
                      : 'bg-[var(--danger-light)] border-[var(--danger)]/20'
                  }`}>
                    {item.value
                      ? <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className={`text-sm font-bold ${item.value ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.detail}</p>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[var(--primary)] font-bold hover:underline mt-1 block">
                          View on RERA portal →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {project.legalNotes && (
                  <p className="text-xs text-[var(--text-muted)] mt-2 italic">{project.legalNotes}</p>
                )}
              </div>
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
                    { label: 'RERA', value: project.reraId || 'N/A' },
                    { label: 'Litigation', value: project.litigation ? '⚠️ Yes' : '✓ No' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">{f.label}</span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share + Save */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.share?.({ title: project.name, url: window.location.href }).catch(() => {})}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                    border border-[var(--border)] rounded-[var(--radius-xs)] text-sm
                    font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={handleSaveToShortlist}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5
                    border rounded-[var(--radius-xs)] text-sm font-semibold transition-colors ${
                    savedToShortlist
                      ? 'bg-[var(--danger-light)] border-[var(--danger)]/30 text-[var(--danger)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
                  }`}>
                  <Heart className={`w-4 h-4 ${savedToShortlist ? 'fill-[var(--danger)]' : ''}`} />
                  {savedToShortlist ? 'Saved' : 'Save'}
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
