'use client';

import { useEffect, useState } from "react";
import { Blog } from "@/types/blog";
import Link from "next/link";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from '@/lib/admin-fetch';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 20;

  const loadBlogs = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/blogs?page=${pageNum}&limit=${limit}`);
      if (!res.ok) throw new Error('Unauthorized');
      const json = await res.json();
      setBlogs(json.blogs || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      const res = await adminFetch(`/api/admin/blogs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Blog deleted');
      loadBlogs(page);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await adminFetch(`/api/admin/blogs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Blog ${newStatus === 'published' ? 'published' : 'unpublished'}`);
      loadBlogs(page);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Blog Posts</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage your blog content · {total} total</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>New Post</span>
        </Link>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Post</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Category</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Views</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">Loading...</td></tr>
            ) : blogs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">No blog posts yet.</td></tr>
            ) : blogs.map((blog) => (
              <tr key={blog.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)]/50 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {blog.coverImage && (
                      <img src={blog.coverImage} alt={blog.title} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{blog.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {' · '}{blog.readingTimeMinutes || '?'} min read
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-[var(--text-secondary)]">{blog.category || '—'}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {blog.status === 'scheduled' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      scheduled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(blog.id, blog.status)}
                      title={blog.status === 'published' ? 'Click to unpublish' : 'Click to publish'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border cursor-pointer hover:opacity-70 transition-opacity ${
                        blog.status === 'published'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                        blog.status === 'published' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      {blog.status}
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs text-[var(--text-muted)]">{blog.viewCount}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    {blog.status === 'published' && (
                      <Link href={`/blogs/${blog.slug}`} target="_blank" className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                    <Link href={`/admin/blogs/${blog.id}/edit`} className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)]">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(blog.id)} className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold border border-[var(--border)] rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
              ← Prev
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-bold border border-[var(--border)] rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
