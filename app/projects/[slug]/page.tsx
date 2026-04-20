'use client';

import { useEffect, useState } from "react";
import { Project, UnitConfig } from "@/types/project";
import { getProjectBySlug } from "@/services/projects";
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
import { Sparkles, MapPin, Share2, Heart, ShieldCheck, Info } from "lucide-react";
import { useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQualificationOpen, setIsQualificationOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitConfig | undefined>(undefined);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await getProjectBySlug(slug as string);
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
  if (!project) return <div>Project not found</div>;

  const minPrice = Math.min(...project.unitConfigs.map(u => u.priceMin));

  return (
    <div className="min-h-screen bg-[var(--background)] pb-32">
      <div className="max-w-md mx-auto">
        {/* Top Header Actions */}
        <div className="px-6 py-4 flex justify-between items-center absolute top-0 left-0 right-0 z-10">
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

        <GallerySlider images={project.images} />

        <SectionContainer className="space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-[var(--text-primary)] leading-tight tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                  {project.name}
                </h1>
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                  <MapPin className="w-4 h-4 text-[var(--primary)]" />
                  <span>{project.location}, {project.city}</span>
                </div>
              </div>
              <TrustScoreBadge score={project.trustScore} size="md" showLabel />
            </div>

            <div className="flex justify-between items-end p-4 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)]">
              <div className="space-y-1">
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Base Price</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{formatINR(minPrice)} <span className="text-xs text-[var(--text-muted)] font-normal">onwards</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Zero Brokerage</p>
                <div className="flex items-center gap-1 text-[var(--success)] text-[10px] font-bold uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Project</span>
                </div>
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
            <div className="grid grid-cols-1 gap-4">
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

          <div className="h-px bg-[var(--border)]" />

          {/* Builder */}
          <BuilderProfile 
            name={project.builderName} 
            experience="15+ Years" 
            projectsDelivered={50} 
          />
        </SectionContainer>
      </div>

      {/* Sticky Bottom Actions */}
      <ConsultationCTA project={project} variant="sticky" triggerSource="project_detail_sticky" />

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
