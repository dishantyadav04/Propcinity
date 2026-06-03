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
  
  const [project, setProject] = useState<Partial<Project>>(initialData || {
    name: '',
    slug: '',
    builderName: '',
    location: '',
    city: 'Pune',
    description: '',
    images: [],
    pros: [],
    cons: [],
    amenities: [],
    unitConfigs: [],
    lat: 18.5204,
    lng: 73.8567,
    reraId: '',
    possessionDate: '',
    launchDate: '',
    isPublished: true,
    litigation: false,
    internalAmenities: [],
    externalAmenities: [],
    nearbyLocations: [],
    reraRegistrations: [],
    masterPlanImages: [],
    constructionStatus: 'under_construction',
    constructionPercent: 0
  });

  useEffect(() => {
    fetch('/api/admin/builders', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setBuilders(d.builders || []))
      .catch(console.error);
  }, []);

  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const body = {
      ...project,
      builder_id: selectedBuilderId || null,
      nearby_locations: project.nearbyLocations || [],
      internal_amenities: project.internalAmenities || [],
      external_amenities: project.externalAmenities || [],
      rera_registrations: project.reraRegistrations || [],
      master_plan_images: project.masterPlanImages || [],
    };
      const response = await fetch(initialData ? `/api/admin/projects/${initialData.id}` : '/api/admin/projects', {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("Failed to save project");
      
      toast.success(initialData ? "Project updated" : "Project created");
      router.push('/admin/projects');
      router.refresh();
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Location</label>
              <input 
                type="text" 
                value={project.location}
                onChange={(e) => setProject({...project, location: e.target.value})}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
                placeholder="e.g. Hinjewadi Phase 1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Construction %</label>
              <input 
                type="number" 
                min="0" max="100"
                value={project.constructionPercent || 0}
                onChange={(e) => setProject({...project, constructionPercent: Number(e.target.value)})}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Geography</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Latitude</label>
              <input 
                type="number" step="any"
                value={project.lat}
                onChange={(e) => setProject({...project, lat: Number(e.target.value)})}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Longitude</label>
              <input 
                type="number" step="any"
                value={project.lng}
                onChange={(e) => setProject({...project, lng: Number(e.target.value)})}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <AdminMapPreview lat={project.lat || 18.5204} lng={project.lng || 73.8567} />
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
          onUpload={(url) => setProject({...project, masterPlanImages: [...(project.masterPlanImages || []), url]})}
          onRemove={(url) => setProject({...project, masterPlanImages: (project.masterPlanImages || []).filter(i => i !== url)})}
          value={project.masterPlanImages || []}
        />
      </div>

      {/* Inventory */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
        <UnitConfigForm 
          units={project.unitConfigs || []}
          onChange={(units) => setProject({...project, unitConfigs: units})}
        />
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
