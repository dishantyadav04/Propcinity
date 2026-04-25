'use client';

import { useEffect, useState } from "react";
import { Project, UnitConfig } from "@/types/project";
import GallerySlider from "@/components/property/GallerySlider";
import TrustScoreBadge from "@/components/property/TrustScoreBadge";
import InsightsPanel from "@/components/property/InsightsPanel";
import WhyThisFitsYou from "@/components/property/WhyThisFitsYou";
import AmenityGrid from "@/components/property/AmenityGrid";
import TimelineSection from "@/components/property/TimelineSection";
import BuilderProfile from "@/components/property/BuilderProfile";
import LocationSection from "@/components/map/LocationSection";
import UnitConfigCard from "@/components/property/UnitConfigCard";
import ConsultationCTA from "@/components/conversion/ConsultationCTA";
import LeadQualificationSheet from "@/components/conversion/LeadQualificationSheet";
import AskAIModal from "@/components/ai/AskAIModal";
import PageLoader from "@/components/ui/PageLoader";
import SectionContainer from "@/components/layout/SectionContainer";
import { formatINR } from "@/lib/finance-calculations";
import { MapPin, Share2, Heart, ShieldCheck, Info } from "lucide-react";
import { useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQualificationOpen, setIsQualificationOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitConfig | undefined>(undefined);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data: Project = await res.json();
        setProject(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();

    const openSheet = (e: any) => {
      setSelectedUnit(e.detail?.unitConfig);
      setIsQualificationOpen(true);
    };

    const openAI = () => setIsAIModalOpen(true);

    window.addEventListener('open-qualification-sheet', openSheet);
    window.addEventListener('open-ai-modal', openAI);
    return () => {
      window.removeEventListener('open-qualification-sheet', openSheet);
      window.removeEventListener('open-ai-modal', openAI);
    };
  }, [slug]);

  if (isLoading) return <PageLoader />;
  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Project not found</h2>
      <p className="text-[var(--text-secondary)]">The project you are looking for does not exist or has been removed.</p>
      <button onClick={() => window.history.back()} className="px-6 py-2 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]">Go Back</button>
    </div>
  );

  const minPrice = project.unitConfigs?.length ? Math.min(...project.unitConfigs.map(u => u.priceMin)) : 0;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-32 lg:pb-12">
      {/* Top Header Actions (Mobile only) */}
      <div className="lg:hidden px-4 py-4 flex justify-between items-center absolute top-0 left-0 right-0 z-10">
        <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white" onClick={() => window.history.back()}>
          <Info className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex gap-2">
          <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      <SectionContainer wide className="lg:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-8">
            <GallerySlider images={project.images} />

            {/* Headline */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] leading-tight tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                    {project.name}
                  </h1>
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <MapPin className="w-4 h-4 text-[var(--primary)]" />
                    <span>{project.location}, {project.city}</span>
                  </div>
                </div>
                <div className="lg:hidden">
                  <TrustScoreBadge score={project.trustScore} size="md" showLabel />
                </div>
              </div>
            </div>

            {/* Fit Analysis */}
            <WhyThisFitsYou project={project} variant="detail" />

            {/* Audit Insights */}
            <InsightsPanel pros={project.pros} cons={project.cons} variant="detail" />

            <div className="h-px bg-[var(--border)]" />

            {/* Inventory */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Available Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.unitConfigs.map(unit => (
                  <UnitConfigCard key={unit.id} unit={unit} project={project} />
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            {/* Map & Surroundings */}
            <LocationSection 
              lat={project.lat} 
              lng={project.lng} 
              projectName={project.name} 
              priceLabel={formatINR(minPrice)}
              location={project.location}
              city={project.city}
            />

            <div className="h-px bg-[var(--border)]" />

            {/* Timeline */}
            <TimelineSection 
              reraNumber={project.reraId} 
              possessionDate={project.possessionDate} 
              launchDate={project.launchDate} 
            />

            <div className="h-px bg-[var(--border)]" />

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Amenities</h3>
              <AmenityGrid amenities={project.amenities} />
            </div>
          </div>

          {/* Right Column (lg:col-span-1, sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Desktop Only Trust Score */}
              <div className="hidden lg:block">
                <TrustScoreBadge score={project.trustScore} size="lg" showLabel />
              </div>

              {/* Price Summary */}
              <div className="p-6 bg-[var(--surface-raised)] rounded-[var(--radius-lg)] border border-[var(--border)] space-y-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Base Price</p>
                  <p className="text-3xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatINR(minPrice)} <span className="text-sm text-[var(--text-muted)] font-bold">onwards</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[var(--success-light)] rounded-[var(--radius-xs)] border border-[var(--success)]/20">
                  <ShieldCheck className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[var(--success)] uppercase tracking-wider">Zero Brokerage</p>
                    <p className="text-[10px] text-[var(--success)]/80 font-medium">100% Verified Project</p>
                  </div>
                </div>
              </div>

              {/* Builder Profile */}
              <BuilderProfile 
                name={project.builderName} 
                experience="15+ Years" 
                projectsDelivered={50} 
              />
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 z-30 lg:z-auto bg-[var(--surface)] border-t border-[var(--border)] p-4 lg:hidden">
         <ConsultationCTA project={project} variant="sticky" triggerSource="project_detail_sticky" />
      </div>

      {/* Modals */}
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
