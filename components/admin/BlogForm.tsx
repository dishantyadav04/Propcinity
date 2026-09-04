'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BlogInput } from '@/lib/blog-schema';
import { slugify } from '@/lib/utils';
import type { Blog } from '@/types/blog';
import RichTextEditor from '@/components/admin/RichTextEditor';
import {
  Upload,
  Eye, EyeOff, Plus, Trash2, ExternalLink,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

interface BlogFormProps {
  blogId?: string;
}

function ImageUploadField({ value, onChange, label, placeholder = 'https://...', onUpload }: {
  value: string
  onChange: (url: string) => void
  label: string
  placeholder?: string
  onUpload: (file: File) => Promise<string | null>
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError('Max 5MB'); return }
    setError(''); setUploading(true)
    const url = await onUpload(file)
    if (url) onChange(url)
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">{label}</label>

      {value ? (
        <div className="relative w-full h-40 rounded-[var(--radius-xs)] overflow-hidden border border-[var(--border)]">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center">✕</button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
          className="w-full h-32 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-xs)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors"
        >
          {uploading ? <span className="text-xs text-[var(--text-muted)]">Uploading...</span> : (
            <>
              <Upload className="w-5 h-5 text-[var(--text-muted)] mb-1" />
              <span className="text-xs text-[var(--text-muted)]">Click or drag to upload</span>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
        </div>
      )}

      {error && <p className="text-[10px] text-[var(--danger)] mt-1">{error}</p>}

      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-muted)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
      />
    </div>
  )
}

function AvatarUploadField({ value, onChange, name, onUpload }: {
  value: string; onChange: (url: string) => void; name: string
  onUpload: (file: File) => Promise<string | null>
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const upload = async (file: File) => {
    setUploading(true)
    const url = await onUpload(file)
    if (url) onChange(url)
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Author Avatar</label>
      <div className="flex items-center gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--border)] overflow-hidden flex items-center justify-center cursor-pointer hover:border-[var(--primary)] bg-[var(--surface-raised)] transition-colors flex-shrink-0"
        >
          {uploading ? <span className="text-[10px] text-[var(--text-muted)]">...</span>
            : value ? <img src={value} alt={name} className="w-full h-full object-cover" />
            : <span className="text-xs font-bold text-[var(--text-muted)]">{initials || '+'}</span>
          }
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
        </div>
        <div className="flex-1">
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://... or upload"
            className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
          {value && <button onClick={() => onChange('')} className="text-[10px] text-[var(--danger)] mt-1">Remove</button>}
        </div>
      </div>
    </div>
  )
}

export default function BlogForm({ blogId }: BlogFormProps) {
  const router = useRouter();
  const isEditing = !!blogId;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [authorName, setAuthorName] = useState('Propcinity Team');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([]);
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [showFaqPanel, setShowFaqPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentHtml, setContentHtml] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  // Load existing blog data
  useEffect(() => {
    if (!blogId) return;
    adminFetch(`/api/admin/blogs/${blogId}`)
      .then(r => r.json())
      .then(({ blog }: { blog: Blog }) => {
        if (!blog) return;
        setTitle(blog.title);
        setSlug(blog.slug);
        setExcerpt(blog.excerpt || '');
        setCoverImage(blog.coverImage || '');
        setCoverImageAlt(blog.coverImageAlt || '');
        setCategory(blog.category || '');
        setTags(blog.tags || []);
        setAuthorName(blog.authorName);
        setAuthorAvatar(blog.authorAvatar || '');
        setStatus(blog.status);
        setScheduledAt(blog.scheduledAt || '');
        setMetaTitle(blog.metaTitle || '');
        setMetaDescription(blog.metaDescription || '');
        setCanonicalUrl(blog.canonicalUrl || '');
        setOgImage(blog.ogImage || '');
        setKeywords(blog.keywords || []);
        setFaqItems(blog.faqJsonld || []);
        setContentHtml(blog.contentHtml || '');
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [blogId]);

  const autoSlug = useCallback(() => {
    if (!isEditing && title && !slug) {
      setSlug(slugify(title));
    }
  }, [title, slug, isEditing]);

  const checkSlug = useCallback(async (s: string) => {
    if (!s || (isEditing)) { setSlugAvailable(null); return; }
    setSlugChecking(true);
    try {
      const res = await adminFetch(`/api/admin/blogs?slug=${encodeURIComponent(s)}`);
      const json = await res.json();
      setSlugAvailable(json.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  }, [isEditing]);

  useEffect(() => {
    autoSlug();
  }, [title]);

  useEffect(() => {
    if (slug) checkSlug(slug);
  }, [slug]);

  // Image upload handler
  const handleImageUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await adminFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      return json.url || null;
    } catch {
      toast.error('Image upload failed');
      return null;
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k)) {
      setKeywords([...keywords, k]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (k: string) => setKeywords(keywords.filter(x => x !== k));

  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqItems];
    updated[index] = { ...updated[index], [field]: value };
    setFaqItems(updated);
  };

  const removeFaqItem = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const html = contentHtml;

    const payload: BlogInput = {
      title,
      slug,
      excerpt: excerpt || undefined,
      contentHtml: html,
      coverImage: coverImage || undefined,
      coverImageAlt: coverImageAlt || undefined,
      authorName,
      authorAvatar: authorAvatar || undefined,
      category: category || undefined,
      tags,
      status,
      publishedAt: undefined,
      scheduledAt: scheduledAt || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      canonicalUrl: canonicalUrl || undefined,
      ogImage: ogImage || undefined,
      faqJsonld: faqItems.length > 0 ? faqItems : undefined,
      keywords,
    };

    setIsSubmitting(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/admin/blogs/${blogId}` : '/api/admin/blogs';
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed');
      }
      toast.success(isEditing ? 'Blog updated' : 'Blog created');
      router.push('/admin/blogs');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] animate-pulse" />
    );
  }

  const seoScore = [
    { label: 'Title (50-60 chars)', check: title.length >= 20 && title.length <= 70, value: `${title.length} chars` },
    { label: 'Meta description (120-155)', check: metaDescription.length >= 70 && metaDescription.length <= 160, value: `${metaDescription.length} chars` },
    { label: 'Slug (under 70 chars)', check: slug.length > 0 && slug.length <= 70, value: `${slug.length} chars` },
    { label: 'Cover image with alt', check: !!coverImage && !!coverImageAlt, value: coverImage && coverImageAlt ? '✓' : '✗' },
    { label: 'H1 present', check: contentHtml.includes('<h1'), value: contentHtml.includes('<h1') ? '✓' : '✗' },
    { label: 'Reading time', check: true, value: `${Math.ceil(contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length / 200)} min` },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
          Title <span className="text-[var(--danger)]">*</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter blog title..."
          className="w-full px-4 py-3 text-lg font-bold bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
          Slug
        </label>
        <div className="flex items-center gap-2">
          <input
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="blog-post-slug"
            className="flex-1 px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
          />
          {slugChecking && <span className="text-xs text-[var(--text-muted)]">Checking...</span>}
          {slugAvailable === false && <span className="text-xs text-[var(--danger)] font-bold">Unavailable</span>}
          {slugAvailable === true && <span className="text-xs text-[var(--success)] font-bold">Available</span>}
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
          Excerpt
          <span className="font-normal normal-case tracking-normal ml-2 text-[10px]">
            ({excerpt.length}/300)
          </span>
        </label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value.slice(0, 300))}
          rows={2}
          placeholder="Brief summary of the post..."
          className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] resize-none"
        />
      </div>

      {/* Cover image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <ImageUploadField
            value={coverImage}
            onChange={setCoverImage}
            label="Cover Image"
            onUpload={handleImageUpload}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Cover Alt Text
          </label>
          <input
            value={coverImageAlt}
            onChange={e => setCoverImageAlt(e.target.value)}
            placeholder="Describe the cover image"
            className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Category & author */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Category</label>
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. Home Buying"
            className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Author Name</label>
          <input
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <AvatarUploadField
            value={authorAvatar}
            onChange={setAuthorAvatar}
            name={authorName}
            onUpload={handleImageUpload}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tags</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="Add a tag and press Enter"
            className="flex-1 px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
          <button onClick={addTag} className="px-3 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-[var(--radius-xs)] hover:opacity-90">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-bold rounded-full">
              {t}
              <button onClick={() => removeTag(t)} className="hover:text-[var(--danger)]">&times;</button>
            </span>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
        {status === 'scheduled' && (
          <input
            type="datetime-local"
            value={scheduledAt ? scheduledAt.slice(0, 16) : ''}
            onChange={e => setScheduledAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)]"
          />
        )}
      </div>

      {/* Rich text editor */}
      <RichTextEditor
        content={contentHtml}
        onChange={setContentHtml}
        placeholder="Write your blog post..."
        minHeight="400px"
      />

      {/* SEO Panel */}
      <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
        <button
          onClick={() => setShowSeoPanel(!showSeoPanel)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[var(--surface-raised)] hover:bg-[var(--surface)] transition-colors"
        >
          <span className="text-sm font-bold text-[var(--text-primary)]">
            {showSeoPanel ? <Eye className="w-4 h-4 inline mr-2" /> : <EyeOff className="w-4 h-4 inline mr-2" />}
            SEO Settings
          </span>
          <span className="text-xs text-[var(--text-muted)]">{showSeoPanel ? '▴' : '▾'}</span>
        </button>
        {showSeoPanel && (
          <div className="p-4 space-y-4 border-t border-[var(--border)]">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Meta Title <span className="font-normal normal-case tracking-normal">({metaTitle.length}/70)</span>
              </label>
              <input value={metaTitle} onChange={e => setMetaTitle(e.target.value.slice(0, 70))} placeholder={title || 'Page title'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Meta Description <span className="font-normal normal-case tracking-normal">({metaDescription.length}/180)</span>
              </label>
              <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value.slice(0, 180))} rows={2}
                placeholder={excerpt || 'Brief page description for search results'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Canonical URL</label>
              <input value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} placeholder="https://propcinity.in/blogs/..."
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <ImageUploadField
                value={ogImage}
                onChange={setOgImage}
                label="OG Image"
                placeholder={coverImage || 'https://...'}
                onUpload={handleImageUpload}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Keywords</label>
              <div className="flex items-center gap-2 mb-2">
                <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Add keyword"
                  className="flex-1 px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]" />
                <button onClick={addKeyword} className="px-3 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-[var(--radius-xs)]">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map(k => (
                  <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--surface-raised)] text-[var(--text-secondary)] text-[11px] font-bold rounded-full">
                    {k}
                    <button onClick={() => removeKeyword(k)} className="hover:text-[var(--danger)]">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* SEO checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {seoScore.map(item => (
                <div key={item.label} className={`p-2 rounded-[var(--radius-xs)] text-[10px] font-bold ${item.check ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {item.label}: {item.value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQ Panel */}
      <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
        <button
          onClick={() => setShowFaqPanel(!showFaqPanel)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[var(--surface-raised)] hover:bg-[var(--surface)] transition-colors"
        >
          <span className="text-sm font-bold text-[var(--text-primary)]">
            FAQ Schema ({faqItems.length} items)
          </span>
          <span className="text-xs text-[var(--text-muted)]">{showFaqPanel ? '▴' : '▾'}</span>
        </button>
        {showFaqPanel && (
          <div className="p-4 space-y-3 border-t border-[var(--border)]">
            {faqItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-start p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xs)]">
                <div className="flex-1 space-y-2">
                  <input
                    value={item.question}
                    onChange={e => updateFaqItem(i, 'question', e.target.value)}
                    placeholder="Question"
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-bold"
                  />
                  <textarea
                    value={item.answer}
                    onChange={e => updateFaqItem(i, 'answer', e.target.value)}
                    placeholder="Answer"
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
                  />
                </div>
                <button onClick={() => removeFaqItem(i)} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] flex-shrink-0 mt-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addFaqItem} className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:opacity-80">
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !title || !slug || !contentHtml || contentHtml === '<p></p>'}
          className="px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </div>
  );
}


