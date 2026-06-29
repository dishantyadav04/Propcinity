import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { Blog, BlogFaqItem } from '@/types/blog'
import { BlogInput } from '@/lib/blog-schema'
import sanitizeHtml from 'sanitize-html'

const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'iframe', 'pre', 'code',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    '*': ['class', 'id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

type SupabaseBlogRow = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content_html: string
  content_json: unknown
  cover_image: string | null
  cover_image_alt: string | null
  author_name: string
  author_avatar: string | null
  category: string | null
  tags: string[] | null
  status: string
  published_at: string | null
  scheduled_at: string | null
  reading_time_minutes: number | null
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  og_image: string | null
  faq_jsonld: unknown
  keywords: string[] | null
  view_count: number
  created_at: string
  updated_at: string
}

function mapBlogRow(row: SupabaseBlogRow): Blog {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    contentHtml: sanitizeHtml(row.content_html, SANITIZE_CONFIG),
    contentJson: row.content_json ?? undefined,
    coverImage: row.cover_image ?? undefined,
    coverImageAlt: row.cover_image_alt ?? undefined,
    authorName: row.author_name || 'Propcinity Team',
    authorAvatar: row.author_avatar ?? undefined,
    category: row.category ?? undefined,
    tags: row.tags || [],
    status: row.status as Blog['status'],
    publishedAt: row.published_at ?? undefined,
    scheduledAt: row.scheduled_at ?? undefined,
    readingTimeMinutes: row.reading_time_minutes ?? undefined,
    metaTitle: row.meta_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    ogImage: row.og_image ?? undefined,
    faqJsonld: row.faq_jsonld as BlogFaqItem[] | undefined,
    keywords: row.keywords || [],
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapBlogInputToRow(data: BlogInput): Record<string, unknown> {
  // Sanitize HTML content on write
  const cleanHtml = sanitizeHtml(data.contentHtml, SANITIZE_CONFIG)

  // Auto-compute reading time
  const wordCount = cleanHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
  const readingTime = data.readingTimeMinutes ?? Math.max(1, Math.ceil(wordCount / 200))

  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt || null,
    content_html: cleanHtml,
    content_json: data.contentJson || null,
    cover_image: data.coverImage || null,
    cover_image_alt: data.coverImageAlt || null,
    author_name: data.authorName,
    author_avatar: data.authorAvatar || null,
    category: data.category || null,
    tags: data.tags,
    status: data.status,
    published_at: data.publishedAt || (data.status === 'published' ? new Date().toISOString() : null),
    scheduled_at: data.scheduledAt || null,
    reading_time_minutes: readingTime,
    meta_title: data.metaTitle || null,
    meta_description: data.metaDescription || null,
    canonical_url: data.canonicalUrl || null,
    og_image: data.ogImage || null,
    faq_jsonld: data.faqJsonld || null,
    keywords: data.keywords,
  }
}

// ─── Public reads ────────────────────────────────────────────────

export async function getPublishedBlogs(
  page: number = 1,
  limit: number = 12,
  filters?: { category?: string; tag?: string }
): Promise<{ blogs: Blog[]; total: number }> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return { blogs: [], total: 0 }

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('blogs')
    .select('*', { count: 'exact' })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.tag) {
    query = query.contains('tags', [filters.tag])
  }

  const { data, error, count } = await query
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[blogs] getPublishedBlogs error:', error)
    return { blogs: [], total: 0 }
  }

  return {
    blogs: (data as SupabaseBlogRow[]).map(mapBlogRow),
    total: count ?? 0,
  }
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', now)
    .single()

  if (error || !data) return null

  // Increment view count fire-and-forget
  const supabaseAdmin = createAdminSupabaseClient()
  if (supabaseAdmin) {
    try {
      await supabaseAdmin
        .from('blogs')
        .update({ view_count: (data as SupabaseBlogRow).view_count + 1 } as any)
        .eq('id', (data as SupabaseBlogRow).id)
    } catch { /* fire-and-forget */ }
  }

  return mapBlogRow(data as SupabaseBlogRow)
}

export async function getRelatedBlogs(
  blogId: string,
  category?: string,
  limit: number = 3
): Promise<Blog[]> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const now = new Date().toISOString()
  let query = supabase
    .from('blogs')
    .select('*')
    .eq('status', 'published')
    .lte('published_at', now)
    .neq('id', blogId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data } = await query
  return (data as SupabaseBlogRow[] || []).map(mapBlogRow)
}

// ─── Admin CRUD ──────────────────────────────────────────────────

export async function adminGetAllBlogs(
  page: number = 1,
  limit: number = 20
): Promise<{ blogs: Blog[]; total: number }> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return { blogs: [], total: 0 }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('blogs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[blogs] adminGetAllBlogs error:', error)
    return { blogs: [], total: 0 }
  }

  return {
    blogs: (data as SupabaseBlogRow[]).map(mapBlogRow),
    total: count ?? 0,
  }
}

export async function adminGetBlogById(id: string): Promise<Blog | null> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapBlogRow(data as SupabaseBlogRow)
}

export async function adminGetBlogBySlug(slug: string): Promise<Blog | null> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return mapBlogRow(data as SupabaseBlogRow)
}

export async function adminCreateBlog(data: BlogInput): Promise<string> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')

  const row = mapBlogInputToRow(data)

  const { data: result, error } = await supabase
    .from('blogs')
    .insert(row)
    .select('id')
    .single()

  if (error || !result) throw new Error(error?.message || 'Create failed')
  return result.id
}

export async function adminUpdateBlog(id: string, data: BlogInput): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')

  const row = mapBlogInputToRow(data)

  const { error } = await supabase
    .from('blogs')
    .update(row)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function adminDeleteBlog(id: string): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return

  await supabase
    .from('blogs')
    .delete()
    .eq('id', id)
}

export async function adminToggleBlogStatus(id: string, status: Blog['status']): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')

  const update: Record<string, unknown> = { status }
  if (status === 'published') {
    update.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('blogs')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getAllPublishedBlogSlugs(): Promise<string[]> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return []

  const now = new Date().toISOString()
  const { data } = await supabase
    .from('blogs')
    .select('slug')
    .eq('status', 'published')
    .lte('published_at', now)

  return (data || []).map((row: { slug: string }) => row.slug)
}
