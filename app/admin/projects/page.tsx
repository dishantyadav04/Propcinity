'use client';

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, ExternalLink } from "lucide-react";
import { formatINR } from "@/lib/finance-calculations";
import TrustScoreBadge from "@/components/property/TrustScoreBadge";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/admin/projects', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Unauthorized');
        const json = await res.json();
        setProjects(json.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Projects</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage your property listings and audit data</p>
        </div>
        <Link 
          href="/admin/projects/new"
          className="flex items-center gap-2 bg-[var(--primary)] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </Link>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Project</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Price Range</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Trust</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const minPrice = Math.min(...project.unitConfigs.map(u => u.priceMin));
              return (
                <tr key={project.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)]/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={project.images[0]} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{project.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{project.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{formatINR(minPrice)}+</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className="font-bold text-sm" style={{ color: project.trustScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                        {project.trustScore}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/projects/${project.slug}`} target="_blank" className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/projects/${project.id}/edit`} className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)]">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
