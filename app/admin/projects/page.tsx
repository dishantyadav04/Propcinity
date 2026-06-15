'use client';

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import Link from "next/link";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { formatINR } from "@/lib/finance-calculations";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 20;

  const loadProjects = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/projects?page=${pageNum}&limit=${limit}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Unauthorized');
      const json = await res.json();
      setProjects(json.projects || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(page);
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Projects</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage your property listings and data · {total} total</p>
        </div>
        <Link 
          href="/admin/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </Link>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Project</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Price Range</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)]">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)]">No projects found.</td></tr>
            ) : projects.map((project) => {
              const minPrice = project.unitConfigs.length > 0 ? Math.min(...project.unitConfigs.map(u => u.priceMin)) : 0;
              return (
                <tr key={project.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)]/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {project.images?.[0] && (
                        <img src={project.images[0]} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{project.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{project.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{formatINR(minPrice)}+</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-2 py-1 text-[10px] font-bold rounded-full bg-[var(--surface-raised)] text-[var(--text-secondary)] capitalize">
                      {project.constructionStatus.replace('_', ' ')} ({project.constructionPercent}%)
                    </span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold border border-[var(--border)]
                rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
              ← Prev
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-bold border border-[var(--border)]
                rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
