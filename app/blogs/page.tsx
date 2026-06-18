'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Blog } from '@/types/blog';
import { Newspaper, Search, Loader2 } from 'lucide-react';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const limit = 12;

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (activeCategory) params.set('category', activeCategory);

    fetch(`/api/blogs?${params}`)
      .then(r => r.json())
      .then(data => {
        setBlogs(data.blogs || []);
        setTotal(data.total || 0);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [page, activeCategory]);

  const filteredBlogs = blogs.filter(b =>
    !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(blogs.map(b => b.category).filter(Boolean))] as string[];
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold rounded-full mb-4">
            <Newspaper className="w-3 h-3" /> Knowledge Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Propcinity Blog
          </h1>
          <p className="mt-3 text-sm sm:text-[15px] text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Expert guides, neighborhood insights, and honest homebuying advice for Pune real estate — from your buyer-side channel partner.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                !activeCategory
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c === activeCategory ? '' : c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  c === activeCategory
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Newspaper className="w-12 h-12 text-[var(--text-muted)]" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">No posts yet</h3>
            <p className="text-sm text-[var(--text-muted)]">Check back soon for our first article.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map(blog => (
              <Link key={blog.id} href={`/blogs/${blog.slug}`}
                className="group bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-all block"
              >
                {blog.coverImage ? (
                  <div className="relative w-full h-48 bg-[var(--surface-raised)]">
                    <img src={blog.coverImage} alt={blog.coverImageAlt || blog.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-[var(--surface-raised)] flex items-center justify-center">
                    <Newspaper className="w-10 h-10 text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  {blog.category && (
                    <span className="inline-block px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-bold rounded-full">
                      {blog.category}
                    </span>
                  )}
                  <h2 className="font-bold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    {blog.title}
                  </h2>
                  {blog.excerpt && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold pt-1">
                    <span>{blog.authorName}</span>
                    <span>·</span>
                    {blog.publishedAt && (
                      <>
                        <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{blog.readingTimeMinutes || '?'} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-xs font-bold border border-[var(--border)] rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                className="px-4 py-2 text-xs font-bold border border-[var(--border)] rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
