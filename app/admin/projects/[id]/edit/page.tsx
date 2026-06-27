'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Project } from "@/types/project";
import PageLoader from "@/components/ui/PageLoader";
import { useParams } from "next/navigation";

const ProjectForm = dynamic(() => import("@/components/admin/ProjectForm"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] animate-pulse" />
  ),
});

export default function EditProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetch(`/api/admin/projects/${id}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Not found');
        const { project: raw } = await res.json();

        const mapped: Project = {
          id: raw.id,
          slug: raw.slug,
          name: raw.name,
          builderName: raw.builder_name || '',
          builderLogo: raw.builder_logo,
          builder_id: raw.builder_id,
          location: raw.location || '',
          city: raw.city || 'Pune',
          lat: Number(raw.lat) || 18.5204,
          lng: Number(raw.lng) || 73.8567,
          tagline: raw.tagline || '',
          description: raw.description || '',
          reraStatus: (raw.rera_status || 'not_registered') as any,
          reraId: raw.rera_id || '',
          reraExpiry: raw.rera_expiry || '',
          reraLink: raw.rera_link || '',
          possessionDate: raw.possession_date || '',
          reraPossessionDate: raw.rera_possession_date || '',
          landParcelAcres: raw.land_parcel_acres,
          totalTowers: raw.total_towers,
          floorsPerTower: raw.floors_per_tower || '',
          unitConfigs: (raw.unit_configs || []).map((u: any) => ({
            id: u.id,
            type: u.type,
            area: Number(u.area),
            price: Number(u.price),
            priceIsPlus: !!u.price_is_plus,
            pricePerSqFt: Number(u.price_per_sqft) || 0,
            facing: u.facing || [],
            floorPlan: u.floor_plan || '',
            images: u.images || [],
            highlights: u.highlights || [],
            minDownpayment: u.min_downpayment ?? undefined,
            parking: u.parking,
          })),
          pros: raw.pros || [],
          cons: raw.cons || [],
          amenities: raw.amenities || [],
          internalAmenities: raw.internal_amenities || [],
          externalAmenities: raw.external_amenities || [],
          images: raw.images || [],
          masterPlanImages: raw.master_plan_images || [],
          floorPlanImages: raw.floor_plan_images || [],
          reraRegistrations: raw.rera_registrations || [],
          nearbyLocations: raw.nearby_locations || [],
          constructionStatus: raw.construction_status || 'under_construction',
          constructionPercent: raw.construction_percent ?? undefined,
          litigation: !!raw.litigation,
          litigationDetails: raw.litigation_details || '',
          commencementCertificate: !!raw.commencement_certificate,
          occupancyCertificate: !!raw.occupancy_certificate,
          legalNotes: raw.legal_notes || '',
          paymentPlans: raw.payment_plans || [],
          bankApprovals: raw.bank_approvals || [],
          videos: raw.videos || [],
          brochureUrl: raw.brochure_url || '',
          isPublished: !!raw.is_published,
        };

        setProject(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [id]);

  if (isLoading) return <PageLoader />;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Edit Project</h1>
        <p className="text-sm text-[var(--text-muted)]">Updating audit data for {project.name}</p>
      </div>
      <ProjectForm initialData={project} />
    </div>
  );
}
