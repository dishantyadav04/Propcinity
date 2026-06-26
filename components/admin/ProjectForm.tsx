'use client';

import { useState, useEffect } from "react";
import { Project, ManualNearbyLocation } from "@/types/project";
import AmenityLibraryManager from "./AmenityLibraryManager";
import NearbyLocationsForm from "./NearbyLocationsForm";
import ImageUpload from "./ImageUpload";
import UnitConfigForm from "./UnitConfigForm";
import AdminMapPreview from "./AdminMapPreview";
import { Save, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const PUNE_LOCALITIES = [
  'Wakad', 'Hinjewadi', 'Hinjewadi Phase 1', 'Hinjewadi Phase 2', 'Hinjewadi Phase 3',
  'Pimpri', 'Chinchwad', 'Baner', 'Balewadi', 'Pashan',
  'Aundh', 'Kothrud', 'Karve Nagar', 'Warje', 'Bavdhan',
  'Shivajinagar', 'Deccan', 'Sadashiv Peth', 'Peth Area',
  'Kharadi', 'Viman Nagar', 'Kalyani Nagar', 'Koregaon Park',
  'Hadapsar', 'Manjari', 'Magarpatta', 'Fursungi',
  'Undri', 'Kondhwa', 'NIBM', 'Mohammadwadi',
  'Sus', 'Mahalunge', 'Punawale', 'Tathawade', 'Maan',
  'Moshi', 'Chakan', 'Talegaon', 'Dehu Road',
  'Lohegaon', 'Dhanori', 'Vishrantwadi', 'Tingre Nagar',
  'Sinhagad Road', 'Dhayari', 'Narhe', 'Ambegaon',
  'Wagholi', 'Nagar Road', 'Mundhwa', 'Kesnand',
  'Pimple Saudagar', 'Pimple Nilakh', 'Ravet', 'Akurdi',
  'Nigdi', 'Pradhikaran', 'Bhosari', 'Dighi',
  'Yerawada', 'Navi Peth', 'Camp', 'Wanowrie',
];

interface ProjectFormProps {
  initialData?: Project;
}

export default function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [builders, setBuilders] = useState<any[]>([]);
  const [selectedBuilderId, setSelectedBuilderId] = useState((initialData as any)?.builder_id || '');
  const [builderSearch, setBuilderSearch] = useState('');
  const [builderDropdownOpen, setBuilderDropdownOpen] = useState(false);

  const filteredBuilders = builders.filter(b =>
    b.name.toLowerCase().includes(builderSearch.toLowerCase())
  );

  const selectedBuilderName = builders.find(b => b.id === selectedBuilderId)?.name || '';

  const [locationSearch, setLocationSearch] = useState(initialData?.location || '');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const filteredLocalities = locationSearch.length >= 1
    ? PUNE_LOCALITIES.filter(l =>
        l.toLowerCase().includes(locationSearch.toLowerCase())
      ).slice(0, 8)
    : PUNE_LOCALITIES.slice(0, 8);

  const [project, setProject] = useState<Partial<Project>>(initialData || {
    name: '',
    slug: '',
    builderName: '',
    location: '',
    city: 'Pune',
    description: '',
    tagline: '',
    images: [],
    pros: [],
    cons: [],
    amenities: [],
    unitConfigs: [],
    lat: 18.5204,
    lng: 73.8567,
    reraId: '',
    reraExpiry: '',
    reraLink: '',
    reraStatus: 'not_registered',
    launchDate: '',
    possessionDate: '',
    reraPossessionDate: '',
    landParcelAcres: undefined,
    totalTowers: undefined,
    floorsPerTower: '',
    totalUnits: undefined,
    availableUnits: undefined,
    isPublished: true,
    litigation: false,
    litigationDetails: '',
    commencementCertificate: false,
    occupancyCertificate: false,
    legalNotes: '',
    brochureUrl: '',
    videos: [],
    paymentPlans: [],
    bankApprovals: [],
    internalAmenities: [],
    externalAmenities: [],
    nearbyLocations: [],
    reraRegistrations: [],
    masterPlanImages: [],
    floorPlanImages: [],
    constructionStatus: 'under_construction',
    constructionPercent: undefined
  });

  useEffect(() => {
    fetch('/api/admin/builders', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setBuilders(d.builders || []))
      .catch(console.error);
  }, []);

  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  const parseIntInput = (val: string): number | undefined => {
    const n = parseInt(val.replace(/^0+/, ''), 10)
    return isNaN(n) ? undefined : n
  }

  const parseFloatInput = (val: string): number | undefined => {
    const n = parseFloat(val)
    return isNaN(n) ? undefined : n
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = {
        ...project,
        builder_id: selectedBuilderId || null,
        builder_name: project.builderName, // Bug 2 fixed: map camelCase to snake_case for Zod
        tagline: project.tagline,
        possession_date: project.possessionDate,
        rera_possession_date: project.reraPossessionDate,
        land_parcel_acres: project.landParcelAcres,
        total_towers: project.totalTowers,
        floors_per_tower: project.floorsPerTower,
        total_units: project.totalUnits,
        available_units: project.availableUnits,
        construction_status: project.constructionStatus,
        construction_percent: project.constructionPercent ?? 0,
        is_published: project.isPublished ?? true,
        launch_date: project.launchDate,
        rera_id: project.reraId,
        rera_expiry: project.reraExpiry,
        rera_link: project.reraLink,
        rera_status: project.reraStatus,
        litigation: project.litigation,
        litigation_details: project.litigationDetails,
        commencement_certificate: project.commencementCertificate,
        occupancy_certificate: project.occupancyCertificate,
        legal_notes: project.legalNotes,
        brochure_url: project.brochureUrl,
        videos: project.videos,
        payment_plans: project.paymentPlans,
        bank_approvals: project.bankApprovals,
        nearby_locations: project.nearbyLocations || [],
        internal_amenities: project.internalAmenities || [],
        external_amenities: project.externalAmenities || [],
        rera_registrations: project.reraRegistrations || [],
        master_plan_images: project.masterPlanImages || [],
        floor_plan_images: project.floorPlanImages || [],
        unitConfigs: (project.unitConfigs || []).map(u => ({
          id: u.id,
          type: u.type,
          area: u.area,
          price_min: u.priceMin,
          price_max: u.priceMax,
          price_per_sqft: u.pricePerSqFt,
          floor: u.floor || '',
          floor_plan: u.floorPlan?.startsWith('http') ? u.floorPlan : undefined,
          facing: u.facing || [],
          images: u.images || [],
          highlights: u.highlights || [],
          total: u.total || 0,
          available: u.available || 0,
          parking: u.parking,
          maintenance_per_month: u.maintenancePerMonth,
        })),
        builderName: undefined,  // Bug 2 fixed: prevent camelCase leak through ...project spread
        possessionDate: undefined,
        reraPossessionDate: undefined,
        landParcelAcres: undefined,
        totalTowers: undefined,
        floorsPerTower: undefined,
        totalUnits: undefined,
        availableUnits: undefined,
        constructionStatus: undefined,
        constructionPercent: undefined,
        launchDate: undefined,
        reraId: undefined,
        reraExpiry: undefined,
        reraLink: undefined,
        reraStatus: undefined,
        litigationDetails: undefined,
        commencementCertificate: undefined,
        occupancyCertificate: undefined,
        legalNotes: undefined,
        brochureUrl: undefined,
        paymentPlans: undefined,
        bankApprovals: undefined,
        nearbyLocations: undefined,
        internalAmenities: undefined,
        externalAmenities: undefined,
        reraRegistrations: undefined,
        masterPlanImages: undefined,
        floorPlanImages: undefined,
        isPublished: undefined,
      };

      const response = await fetch(initialData ? `/api/admin/projects?id=${initialData.id}` : '/api/admin/projects', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save project");
      }

      toast.success(initialData ? "Project updated" : "Project created");
      router.push('/admin/projects');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">General Information</h3>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Project Name</label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject({...project, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              placeholder="e.g. Godrej Woodsville"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--text-primary)]">
              Builder <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={builderDropdownOpen ? builderSearch : selectedBuilderName}
                onChange={e => {
                  setBuilderSearch(e.target.value);
                  setBuilderDropdownOpen(true);
                }}
                onFocus={() => {
                  setBuilderSearch('');
                  setBuilderDropdownOpen(true);
                }}
                onBlur={() => setTimeout(() => setBuilderDropdownOpen(false), 150)}
                placeholder="Search or select a builder..."
                className="w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                  rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)] pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                ▾
              </span>
              {builderDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-[var(--border)]
                  rounded-[var(--radius-xs)] shadow-lg max-h-52 overflow-y-auto">
                  <div
                    onMouseDown={() => {
                      setSelectedBuilderId('');
                      setProject(prev => ({ ...prev, builderName: '' }));
                      setBuilderDropdownOpen(false);
                      setBuilderSearch('');
                    }}
                    className="px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-raised)] cursor-pointer"
                  >
                    — Clear selection —
                  </div>
                  {filteredBuilders.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No builders found</div>
                  ) : (
                    filteredBuilders.map(b => (
                      <div
                        key={b.id}
                        onMouseDown={() => {
                          setSelectedBuilderId(b.id);
                          setProject(prev => ({ ...prev, builderName: b.name }));
                          setBuilderDropdownOpen(false);
                          setBuilderSearch('');
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-raised)] transition-colors ${
                          selectedBuilderId === b.id
                            ? 'font-bold text-[var(--primary)] bg-[var(--surface-raised)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {b.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Location</label>
            <div className="relative">
              <input
                type="text"
                value={locationSearch}
                onChange={e => {
                  setLocationSearch(e.target.value);
                  setProject({ ...project, location: e.target.value });
                  setLocationDropdownOpen(true);
                }}
                onFocus={() => setLocationDropdownOpen(true)}
                onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 150)}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm pr-8 focus:outline-none focus:border-[var(--primary)]"
                placeholder="e.g. Wakad, Hinjewadi..."
                autoComplete="off"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] text-xs">
                ▾
              </span>
              {locationDropdownOpen && filteredLocalities.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-[var(--border)] rounded-[var(--radius-xs)] shadow-lg max-h-52 overflow-y-auto">
                  {filteredLocalities.map(locality => (
                    <div
                      key={locality}
                      onMouseDown={() => {
                        setLocationSearch(locality);
                        setProject(prev => ({ ...prev, location: locality }));
                        setLocationDropdownOpen(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-raised)] transition-colors ${
                        project.location === locality
                          ? 'font-bold text-[var(--primary)] bg-[var(--surface-raised)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {locality}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Geography</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Latitude</label>
              <input
                type="text"
                inputMode="numeric"
                value={project.lat ?? ''}
                onChange={(e) => setProject({...project, lat: parseFloatInput(e.target.value) ?? 18.5204})}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Longitude</label>
              <input
                type="text"
                inputMode="numeric"
                value={project.lng ?? ''}
                onChange={(e) => setProject({...project, lng: parseFloatInput(e.target.value) ?? 73.8567})}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <AdminMapPreview lat={project.lat || 18.5204} lng={project.lng || 73.8567} />
        </div>
      </div>

      {/* Project Specs & Dates */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Project Specs & Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Tagline</label>
            <input
              type="text"
              value={project.tagline || ''}
              onChange={(e) => setProject({...project, tagline: e.target.value})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              placeholder="e.g. Experience luxury living"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Launch Date</label>
            <input
              type="date"
              value={project.launchDate || ''}
              onChange={(e) => setProject({...project, launchDate: e.target.value})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Target Possession</label>
            <input
              type="date"
              value={project.possessionDate || ''}
              onChange={(e) => setProject({...project, possessionDate: e.target.value})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">RERA Possession Date</label>
            <input
              type="date"
              value={project.reraPossessionDate || ''}
              onChange={(e) => setProject({...project, reraPossessionDate: e.target.value})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Units</label>
            <input
              type="text"
              inputMode="numeric"
              value={project.totalUnits ?? ''}
              onChange={(e) => setProject({...project, totalUnits: parseIntInput(e.target.value)})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Available Units</label>
            <input
              type="text"
              inputMode="numeric"
              value={project.availableUnits ?? ''}
              onChange={(e) => setProject({...project, availableUnits: parseIntInput(e.target.value)})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Land Parcel (acres)</label>
            <input
              type="text"
              inputMode="numeric"
              value={project.landParcelAcres ?? ''}
              onChange={(e) => setProject({...project, landParcelAcres: parseFloatInput(e.target.value)})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Towers</label>
            <input
              type="text"
              inputMode="numeric"
              value={project.totalTowers ?? ''}
              onChange={(e) => setProject({...project, totalTowers: parseIntInput(e.target.value)})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Floors Per Tower</label>
            <input
              type="text"
              value={project.floorsPerTower || ''}
              onChange={(e) => setProject({...project, floorsPerTower: e.target.value})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              placeholder="e.g. G+33"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Construction Status</label>
            <select
              value={project.constructionStatus || 'under_construction'}
              onChange={(e) => setProject({ ...project, constructionStatus: e.target.value as any })}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="pre_launch">Pre-Launch</option>
              <option value="new_launch">New Launch</option>
              <option value="under_construction">Under Construction</option>
              <option value="ready_to_move">Ready to Move</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Construction %</label>
            <input
              type="text"
              inputMode="numeric"
              value={project.constructionPercent ?? ''}
              onChange={(e) => setProject({...project, constructionPercent: parseIntInput(e.target.value) ?? 0})}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Project Gallery</h3>
        <ImageUpload
          value={project.images}
          onUpload={(url) => setProject({...project, images: [...(project.images || []), url]})}
          onRemove={(url) => setProject({...project, images: project.images?.filter(i => i !== url)})}
        />
      </div>

      {/* Master Plan Images */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
          Master Plan Images
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Upload layout/site plan images. These appear in the Master Plan section.
        </p>
        <ImageUpload
          onUpload={(url) => setProject(prev => ({...prev, masterPlanImages: [...(prev.masterPlanImages || []), url]}))}
          onRemove={(url) => setProject(prev => ({...prev, masterPlanImages: (prev.masterPlanImages || []).filter(i => i !== url)}))}
          value={project.masterPlanImages || []}
        />
      </div>

      {/* Floor Plan Images */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
          Floor Plan Images
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Upload general floor plan images. These appear in the Floor Plans section alongside per-unit plans.
        </p>
        <ImageUpload
          onUpload={(url) => setProject(prev => ({...prev, floorPlanImages: [...(prev.floorPlanImages || []), url]}))}
          onRemove={(url) => setProject(prev => ({...prev, floorPlanImages: (prev.floorPlanImages || []).filter(i => i !== url)}))}
          value={project.floorPlanImages || []}
        />
      </div>

      {/* Media & Documents */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Media & Documents</h3>
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Brochure URL</label>
          <input
            type="url"
            value={project.brochureUrl || ''}
            onChange={(e) => setProject({...project, brochureUrl: e.target.value})}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Videos (YouTube)</h4>
            <button
              type="button"
              onClick={() => setProject({
                ...project,
                videos: [...(project.videos || []), { label: '', youtubeUrl: '' }]
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)]/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Video
            </button>
          </div>
          {(project.videos || []).map((video, idx) => (
            <div key={idx} className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--text-muted)] uppercase">Video #{idx + 1}</span>
                <button type="button"
                  onClick={() => setProject({
                    ...project,
                    videos: (project.videos || []).filter((_, i) => i !== idx)
                  })}
                  className="text-[var(--text-muted)] hover:text-red-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Label</label>
                  <input type="text" value={video.label}
                    onChange={e => setProject({
                      ...project,
                      videos: (project.videos || []).map((v, i) => i === idx ? { ...v, label: e.target.value } : v)
                    })}
                    placeholder="e.g. 3.5BHK Sample Flat"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">YouTube URL</label>
                  <input type="url" value={video.youtubeUrl}
                    onChange={e => setProject({
                      ...project,
                      videos: (project.videos || []).map((v, i) => i === idx ? { ...v, youtubeUrl: e.target.value } : v)
                    })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
              </div>
            </div>
          ))}
          {(project.videos || []).length === 0 && (
            <p className="text-xs text-[var(--text-muted)] italic">No videos added yet.</p>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
        <UnitConfigForm
          units={project.unitConfigs || []}
          onChange={(units) => setProject({...project, unitConfigs: units})}
        />
      </div>

      {/* Payment Plans & Bank Approvals */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Payment Plans</h3>
            <button
              type="button"
              onClick={() => setProject({
                ...project,
                paymentPlans: [...(project.paymentPlans || []), { name: '', description: '' }]
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)]/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Plan
            </button>
          </div>
          {(project.paymentPlans || []).map((plan, idx) => (
            <div key={idx} className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--text-muted)] uppercase">Plan #{idx + 1}</span>
                <button type="button"
                  onClick={() => setProject({
                    ...project,
                    paymentPlans: (project.paymentPlans || []).filter((_, i) => i !== idx)
                  })}
                  className="text-[var(--text-muted)] hover:text-red-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Plan Name</label>
                  <input type="text" value={plan.name}
                    onChange={e => setProject({
                      ...project,
                      paymentPlans: (project.paymentPlans || []).map((p, i) => i === idx ? { ...p, name: e.target.value } : p)
                    })}
                    placeholder="e.g. CLP, Flexi Plan"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Description</label>
                  <input type="text" value={plan.description}
                    onChange={e => setProject({
                      ...project,
                      paymentPlans: (project.paymentPlans || []).map((p, i) => i === idx ? { ...p, description: e.target.value } : p)
                    })}
                    placeholder="e.g. 10-80-10 plan"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
              </div>
            </div>
          ))}
          {(project.paymentPlans || []).length === 0 && (
            <p className="text-xs text-[var(--text-muted)] italic">No payment plans added yet.</p>
          )}
        </div>

        <div className="space-y-3 border-t border-[var(--border)] pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Bank Approvals</h3>
            <button
              type="button"
              onClick={() => setProject({
                ...project,
                bankApprovals: [...(project.bankApprovals || []), { bankName: '', logoUrl: '' }]
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)]/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bank
            </button>
          </div>
          {(project.bankApprovals || []).map((bank, idx) => (
            <div key={idx} className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--text-muted)] uppercase">Bank #{idx + 1}</span>
                <button type="button"
                  onClick={() => setProject({
                    ...project,
                    bankApprovals: (project.bankApprovals || []).filter((_, i) => i !== idx)
                  })}
                  className="text-[var(--text-muted)] hover:text-red-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Bank Name</label>
                  <input type="text" value={bank.bankName}
                    onChange={e => setProject({
                      ...project,
                      bankApprovals: (project.bankApprovals || []).map((b, i) => i === idx ? { ...b, bankName: e.target.value } : b)
                    })}
                    placeholder="e.g. SBI, HDFC"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Logo URL (optional)</label>
                  <input type="url" value={bank.logoUrl || ''}
                    onChange={e => setProject({
                      ...project,
                      bankApprovals: (project.bankApprovals || []).map((b, i) => i === idx ? { ...b, logoUrl: e.target.value } : b)
                    })}
                    placeholder="https://..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
              </div>
            </div>
          ))}
          {(project.bankApprovals || []).length === 0 && (
            <p className="text-xs text-[var(--text-muted)] italic">No bank approvals added yet.</p>
          )}
        </div>
      </div>

      {/* RERA Status */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">RERA Status</h3>
        <div className="max-w-xs">
          <select
            value={project.reraStatus || 'not_registered'}
            onChange={(e) => setProject({ ...project, reraStatus: e.target.value as any })}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="registered">✓ Registered</option>
            <option value="expired">⚠ Expired</option>
            <option value="pending">⏳ Pending</option>
            <option value="not_registered">✗ Not Registered</option>
          </select>
        </div>
      </div>

      {/* RERA Registrations */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
          RERA Registrations
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Add one or multiple RERA registration numbers. Each gets its own QR code on the property page.
        </p>

        <div className="space-y-3">
          {(project.reraRegistrations || []).map((reg, idx) => (
            <div key={reg.id} className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--text-muted)] uppercase">Registration #{idx + 1}</span>
                <button type="button"
                  onClick={() => setProject({
                    ...project,
                    reraRegistrations: (project.reraRegistrations || []).filter(r => r.id !== reg.id)
                  })}
                  className="text-[var(--text-muted)] hover:text-red-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">RERA Number *</label>
                  <input type="text" value={reg.reraId}
                    onChange={e => setProject({
                      ...project,
                      reraRegistrations: (project.reraRegistrations || []).map(r =>
                        r.id === reg.id ? { ...r, reraId: e.target.value } : r
                      )
                    })}
                    placeholder="e.g. P52100047931"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">RERA Portal Link</label>
                  <input type="url" value={reg.reraLink || ''}
                    onChange={e => setProject({
                      ...project,
                      reraRegistrations: (project.reraRegistrations || []).map(r =>
                        r.id === reg.id ? { ...r, reraLink: e.target.value } : r
                      )
                    })}
                    placeholder="https://maharera.mahaonline.gov.in/..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Description (optional)</label>
                  <input type="text" value={reg.description || ''}
                    onChange={e => setProject({
                      ...project,
                      reraRegistrations: (project.reraRegistrations || []).map(r =>
                        r.id === reg.id ? { ...r, description: e.target.value } : r
                      )
                    })}
                    placeholder="e.g. Tower 1–2"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button"
          onClick={() => setProject({
            ...project,
            reraRegistrations: [
              ...(project.reraRegistrations || []),
              { id: crypto.randomUUID(), reraId: '', reraLink: '', description: '' }
            ]
          })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)]/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add RERA Registration
        </button>
      </div>

      {/* Legal & Compliance */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Legal & Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={project.litigation || false}
                onChange={(e) => setProject({...project, litigation: e.target.checked})}
                className="w-4 h-4 rounded border-[var(--border)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">Litigation</span>
            </label>
            {project.litigation && (
              <div className="space-y-1 pl-7">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Litigation Details</label>
                <textarea
                  value={project.litigationDetails || ''}
                  onChange={(e) => setProject({...project, litigationDetails: e.target.value})}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm min-h-[80px]"
                  placeholder="Describe any ongoing litigation..."
                />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={project.commencementCertificate || false}
                onChange={(e) => setProject({...project, commencementCertificate: e.target.checked})}
                className="w-4 h-4 rounded border-[var(--border)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">Commencement Certificate</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={project.occupancyCertificate || false}
                onChange={(e) => setProject({...project, occupancyCertificate: e.target.checked})}
                className="w-4 h-4 rounded border-[var(--border)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">Occupancy Certificate</span>
            </label>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Legal Notes</label>
          <textarea
            value={project.legalNotes || ''}
            onChange={(e) => setProject({...project, legalNotes: e.target.value})}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm min-h-[80px]"
            placeholder="Any additional legal notes..."
          />
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--success)] uppercase tracking-widest">Pros</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPro}
              onChange={(e) => setNewPro(e.target.value)}
              className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs"
              placeholder="Add a pro..."
            />
            <button
              type="button"
              onClick={() => { if(newPro) { setProject({...project, pros: [...(project.pros || []), newPro]}); setNewPro(""); } }}
              className="p-2 bg-[var(--success)]/10 text-[var(--success)] rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {project.pros?.map((pro, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-[var(--surface-raised)] rounded-lg text-xs">
                <span>{pro}</span>
                <button type="button" onClick={() => setProject({...project, pros: project.pros?.filter((_, idx) => idx !== i)})} className="text-[var(--danger)]">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--danger)] uppercase tracking-widest">Cons</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCon}
              onChange={(e) => setNewCon(e.target.value)}
              className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs"
              placeholder="Add a con..."
            />
            <button
              type="button"
              onClick={() => { if(newCon) { setProject({...project, cons: [...(project.cons || []), newCon]}); setNewCon(""); } }}
              className="p-2 bg-[var(--danger)]/10 text-[var(--danger)] rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {project.cons?.map((con, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-[var(--surface-raised)] rounded-lg text-xs">
                <span>{con}</span>
                <button type="button" onClick={() => setProject({...project, cons: project.cons?.filter((_, idx) => idx !== i)})} className="text-[var(--danger)]">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Amenities */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Amenities</h3>
        <AmenityLibraryManager
          selectedInternal={project.internalAmenities || []}
          selectedExternal={project.externalAmenities || []}
          onChangeInternal={(items) => setProject({ ...project, internalAmenities: items })}
          onChangeExternal={(items) => setProject({ ...project, externalAmenities: items })}
        />
      </div>

      {/* Nearby Locations */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
        <NearbyLocationsForm
          value={(project.nearbyLocations as ManualNearbyLocation[]) || []}
          onChange={(locs) => setProject({ ...project, nearbyLocations: locs })}
        />
      </div>

      <div className="flex justify-end pt-4 pb-20 md:pb-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-[var(--primary)] text-white font-bold py-4 px-12 rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{initialData ? 'Update Project' : 'Publish Project'}</span>
        </button>
      </div>
    </form>
  );
}
