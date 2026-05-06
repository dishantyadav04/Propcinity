'use client';

import { useState, useEffect } from "react";
import { Project } from "@/types/project";
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
      const body = { ...project, builder_id: selectedBuilderId || null };
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
            <select value={selectedBuilderId}
              onChange={e => {
                setSelectedBuilderId(e.target.value);
                const builder = builders.find(b => b.id === e.target.value);
                if (builder) {
                  setProject(prev => ({ ...prev, builderName: builder.name }));
                }
              }}
              className="w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]">
              <option value="">Select a builder...</option>
              {builders.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
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

      {/* Inventory */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
        <UnitConfigForm 
          units={project.unitConfigs || []}
          onChange={(units) => setProject({...project, unitConfigs: units})}
        />
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
