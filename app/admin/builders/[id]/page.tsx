'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit2, Plus, CheckCircle2, Clock,
  AlertTriangle, Building2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BuilderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [builder, setBuilder] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [updateForm, setUpdateForm] = useState({
    delay_months: 0, is_delivered: false, complaints_count: 0,
    quality_rating: 3, notes: '', actual_possession: ''
  });

  useEffect(() => {
    fetch('/api/admin/builders', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setBuilder((d.builders || []).find((b: any) => b.id === id) || null));

    fetch('/api/admin/projects', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const linked = (d.projects || []).filter((p: any) => p.builder_id === id);
        setProjects(linked);
      });
  }, [id]);

  const handleProjectUpdate = async () => {
    const project = projects.find((p: any) => p.id === selectedProject);
    const res = await fetch(`/api/admin/builders/${id}/project-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        project_id: selectedProject,
        project_name: project?.name,
        ...updateForm,
      }),
    });
    if (res.ok) {
      toast.success('Project update saved. Builder score recalculated.');
      setShowUpdateForm(false);
      // Reload builder to show new score
      fetch('/api/admin/builders', { credentials: 'include' })
        .then(r => r.json())
        .then(d => setBuilder((d.builders || []).find((b: any) => b.id === id) || null));
    } else {
      toast.error('Failed to save update');
    }
  };

  if (!builder) return <div className="p-8 text-[var(--text-muted)] animate-pulse">Loading...</div>;

  const scoreColor = builder.builder_score >= 80 ? 'text-green-600' :
    builder.builder_score >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-6 sm:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/builders')}
          className="p-2 hover:bg-[var(--surface-raised)] rounded-[var(--radius-xs)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>{builder.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">{builder.headquartered} · Est. {builder.established_year}</p>
        </div>
        <Link href={`/admin/builders/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border)]
            text-sm font-bold rounded-[var(--radius)] hover:bg-[var(--surface-raised)] transition-colors">
          <Edit2 className="w-4 h-4" /> Edit
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Score card */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 text-center space-y-3">
          <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Builder Score</p>
          <p className={`text-5xl font-black ${scoreColor}`}>{builder.builder_score}</p>
          <div className="h-2 bg-[var(--surface-raised)] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${
              builder.builder_score >= 80 ? 'bg-green-500' :
              builder.builder_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`} style={{ width: `${builder.builder_score}%` }} />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Affects trust score of {projects.length} linked project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-[var(--radius)] p-5">
          <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Projects Delivered', value: builder.total_projects_delivered || 0 },
              { label: 'On-Time %', value: `${builder.on_time_delivery_percent || 0}%` },
              { label: 'Avg Delay', value: `${builder.avg_delay_months || 0}mo` },
              { label: 'Legal Cases', value: builder.legal_cases || 0 },
              { label: 'Complaints', value: builder.customer_complaints || 0 },
              { label: 'RERA', value: builder.rera_registered ? 'Yes ✓' : 'No ✗' },
            ].map(m => (
              <div key={m.label} className="p-3 bg-[var(--surface-raised)] rounded-[var(--radius-xs)]">
                <p className="text-xs text-[var(--text-muted)] font-semibold">{m.label}</p>
                <p className="text-lg font-black text-[var(--text-primary)] mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Linked projects */}
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-black text-[var(--text-primary)]">
            Linked Projects ({projects.length})
          </h2>
          <button onClick={() => setShowUpdateForm(!showUpdateForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-white
              text-xs font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> Add Project Update
          </button>
        </div>

        {/* Project update form */}
        {showUpdateForm && (
          <div className="p-5 bg-[var(--primary-light)] border-b border-[var(--border)] space-y-4">
            <h3 className="text-sm font-black text-[var(--text-primary)]">
              Update Delivery Data (affects builder score)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">Project</label>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[var(--border)]
                    rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">Delay (months)</label>
                <input type="number" min={0} value={updateForm.delay_months}
                  onChange={e => setUpdateForm(f => ({ ...f, delay_months: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[var(--border)]
                    rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">Complaints</label>
                <input type="number" min={0} value={updateForm.complaints_count}
                  onChange={e => setUpdateForm(f => ({ ...f, complaints_count: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[var(--border)]
                    rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">Quality Rating (1-5)</label>
                <input type="number" min={1} max={5} value={updateForm.quality_rating}
                  onChange={e => setUpdateForm(f => ({ ...f, quality_rating: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[var(--border)]
                    rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-[var(--text-muted)]">Notes</label>
                <textarea value={updateForm.notes} rows={2}
                  onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[var(--border)]
                    rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)] resize-none" />
              </div>
              <label className="flex items-center gap-2 col-span-2 text-sm font-semibold cursor-pointer">
                <input type="checkbox" checked={updateForm.is_delivered}
                  onChange={e => setUpdateForm(f => ({ ...f, is_delivered: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--primary)]" />
                Mark as Delivered
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleProjectUpdate}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-bold
                  rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity">
                Save & Recalculate Score
              </button>
              <button onClick={() => setShowUpdateForm(false)}
                className="px-5 py-2 border border-[var(--border)] text-sm font-bold rounded-[var(--radius-xs)]">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-[var(--border)]">
          {projects.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--text-muted)] text-center">
              No projects linked to this builder yet.
            </p>
          ) : projects.map(p => (
            <div key={p.id} className="px-5 py-3.5 flex items-center gap-4">
              <Building2 className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--text-primary)]">{p.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{p.location}</p>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                (p.trust_score || 0) >= 70 ? 'bg-green-50 text-green-600' :
                (p.trust_score || 0) >= 45 ? 'bg-amber-50 text-amber-600' :
                'bg-red-50 text-red-600'
              }`}>
                Trust: {p.trust_score || 0}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                p.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {p.is_published ? 'Live' : 'Draft'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
