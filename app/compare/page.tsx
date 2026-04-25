'use client';

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Project } from "@/types/project";
import SectionContainer from "@/components/layout/SectionContainer";
import TrustScoreBadge from "@/components/property/TrustScoreBadge";
import { formatINR } from "@/lib/finance-calculations";
import { Check, Minus, MapPin, Building2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Suspense } from "react";

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams?.get('ids')?.split(',') || [];
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setIsLoading(false);
      return;
    }

    Promise.all(ids.map(id => 
      fetch(`/api/projects/${id}`).then(r => r.ok ? r.json() : null)
    ))
    .then(results => {
      setProjects(results.filter(Boolean));
    })
    .catch(console.error)
    .finally(() => setIsLoading(false));
  }, [searchParams]);

  // Extract all unique amenities for comparison
  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => p.amenities.forEach(a => set.add(a)));
    return Array.from(set).sort();
  }, [projects]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">
            Loading comparison...
          </p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Nothing to compare</h2>
        <p className="text-[var(--text-secondary)]">Go to Explore to select projects for comparison.</p>
        <Link href="/explore" className="px-6 py-2 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]">
          Explore Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] pt-8 pb-6 sticky top-0 z-20">
        <SectionContainer wide>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => window.history.back()}
              className="p-2 hover:bg-[var(--surface-raised)] rounded-full transition-colors text-[var(--text-primary)]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>
              Comparing {projects.length} Projects
            </h1>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer wide className="py-8">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="min-w-max">
            {/* Headers Row */}
            <div className="flex border-b border-[var(--border)] pb-6 mb-6">
              <div className="w-48 flex-shrink-0" /> {/* Empty corner */}
              {projects.map(project => (
                <div key={project.id} className="w-64 flex-shrink-0 px-4 space-y-4 border-l border-[var(--border)]">
                  <div className="aspect-video rounded-[var(--radius)] overflow-hidden bg-[var(--surface-raised)] relative">
                    {project.images?.[0] ? (
                      <img src={project.images[0]} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-[var(--text-muted)]" /></div>
                    )}
                    <div className="absolute top-2 right-2">
                      <TrustScoreBadge score={project.trustScore} size="sm" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] line-clamp-1">{project.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {project.location}
                    </p>
                  </div>
                  <Link href={`/projects/${project.slug}`}
                    className="block w-full py-2 text-center text-xs font-bold bg-[var(--primary-light)]
                      text-[var(--primary)] rounded-[var(--radius-xs)] hover:bg-[var(--primary)]
                      hover:text-white transition-colors">
                    View Details
                  </Link>
                </div>
              ))}
            </div>

            {/* Price section */}
            <div className="flex mb-6">
              <div className="w-48 flex-shrink-0 py-4">
                <p className="font-black text-sm text-[var(--text-secondary)] uppercase tracking-wider">Pricing</p>
              </div>
              {projects.map(project => {
                const minPrice = project.unitConfigs.length
                  ? Math.min(...project.unitConfigs.map(u => u.priceMin)) : 0;
                return (
                  <div key={project.id} className="w-64 flex-shrink-0 px-4 py-4 border-l border-[var(--border)]">
                    <p className="text-xl font-black text-[var(--primary)]">{formatINR(minPrice)}</p>
                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">Starting Price</p>
                  </div>
                );
              })}
            </div>

            {/* Details section */}
            <div className="flex mb-6">
              <div className="w-48 flex-shrink-0 py-4">
                <p className="font-black text-sm text-[var(--text-secondary)] uppercase tracking-wider">Details</p>
              </div>
              {projects.map(project => (
                <div key={project.id} className="w-64 flex-shrink-0 px-4 py-4 border-l border-[var(--border)] space-y-4">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-bold mb-1">Builder</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{project.builderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-bold mb-1">Possession</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{project.possessionDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-bold mb-1">Configurations</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(project.unitConfigs.map(u => u.type))).map(type => (
                        <span key={type} className="px-2 py-0.5 bg-[var(--surface-raised)] text-[var(--text-secondary)] text-[10px] font-bold rounded-full border border-[var(--border)]">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-bold mb-1">RERA Status</p>
                    <p className={`text-sm font-bold ${project.reraId ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                      {project.reraId ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Amenities Section */}
            <div className="flex">
              <div className="w-48 flex-shrink-0 py-4">
                <p className="font-black text-sm text-[var(--text-secondary)] uppercase tracking-wider">Amenities</p>
              </div>
              <div className="flex flex-1">
                {/* We render cells per project for each amenity */}
              </div>
            </div>
            
            <div className="border-t border-[var(--border)]">
              {allAmenities.map((amenity, idx) => (
                <div key={amenity} className={`flex ${idx % 2 === 0 ? 'bg-[var(--surface-raised)]' : 'bg-white'}`}>
                  <div className="w-48 flex-shrink-0 p-4 flex items-center">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{amenity}</p>
                  </div>
                  {projects.map(project => {
                    const hasAmenity = project.amenities.includes(amenity);
                    return (
                      <div key={project.id} className="w-64 flex-shrink-0 p-4 border-l border-[var(--border)] flex items-center justify-center">
                        {hasAmenity 
                          ? <Check className="w-5 h-5 text-[var(--success)]" />
                          : <Minus className="w-5 h-5 text-[var(--border-strong)]" />
                        }
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </SectionContainer>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">
            Loading comparison...
          </p>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
