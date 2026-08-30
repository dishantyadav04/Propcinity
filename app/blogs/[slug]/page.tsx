import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { getBlogBySlugCached, getRelatedBlogs, getAllPublishedBlogSlugs } from '@/services/blogs'
import { ArrowLeft, Calendar, Clock, User, Tag } from 'lucide-react'
import ShareButtons from '@/components/blogs/ShareButtons'

export async function generateStaticParams() {
  const slugs = await getAllPublishedBlogSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlogBySlugCached(slug)
  if (!blog) return {}

  const title = blog.metaTitle || blog.title
  const description = blog.metaDescription || blog.excerpt || undefined
  const ogImg = blog.ogImage || blog.coverImage
  const publishedTime = blog.publishedAt || undefined

  return {
    title: `${title} — Propcinity Blog`,
    description,
    alternates: {
      canonical: blog.canonicalUrl || `https://propcinity.in/blogs/${blog.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      images: ogImg ? [{ url: ogImg, width: 1200, height: 630 }] : undefined,
      authors: [blog.authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImg ? [ogImg] : undefined,
    },
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const blog = await getBlogBySlugCached(slug)
  if (!blog) notFound()

  const related = await getRelatedBlogs(blog.id, blog.category, 3)

  // Schema definitions
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://propcinity.in" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://propcinity.in/blogs" },
      { "@type": "ListItem", "position": 3, "name": blog.title, "item": `https://propcinity.in/blogs/${blog.slug}` },
    ],
  }

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.metaTitle || blog.title,
    "image": blog.ogImage || blog.coverImage || undefined,
    "author": {
      "@type": "Person",
      "name": blog.authorName,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Propcinity",
    },
    "datePublished": blog.publishedAt,
    "dateModified": blog.updatedAt,
    "description": blog.metaDescription || blog.excerpt || undefined,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://propcinity.in/blogs/${blog.slug}`,
    },
  }

  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* JSON-LD schema */}
      <Script id="blog-breadcrumb-schema" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="blog-posting-schema" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      {blog.faqJsonld && blog.faqJsonld.length > 0 && (
        <Script id="blog-faq-schema" type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": blog.faqJsonld.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.answer,
                },
              })),
            }),
          }}
        />
      )}

      {/* Cover image */}
      {blog.coverImage && (
        <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-[var(--surface-raised)]">
          <img
            src={blog.coverImage}
            alt={blog.coverImageAlt || blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <Link href="/blogs"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All Posts
        </Link>

        {/* Header */}
        <header className="space-y-4 mb-8">
          {blog.category && (
            <Link href={`/blogs?category=${encodeURIComponent(blog.category)}`}
              className="inline-block px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold rounded-full"
            >
              {blog.category}
            </Link>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            {blog.title}
          </h1>
          {blog.excerpt && (
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">{blog.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] pt-2">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span className="font-semibold text-[var(--text-secondary)]">{blog.authorName}</span>
            </div>
            {publishedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{publishedDate}</span>
              </div>
            )}
            {blog.readingTimeMinutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{blog.readingTimeMinutes} min read</span>
              </div>
            )}
          </div>

          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              <Tag className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
              {blog.tags.map(t => (
                <span key={t}
                  className="px-2 py-0.5 bg-[var(--surface-raised)] text-[var(--text-secondary)] text-[11px] font-bold rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div
          className="blog-content prose prose-lg max-w-none pb-12 border-b border-[var(--border)]
            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-[var(--text-primary)] [&_h1]:mt-12 [&_h1]:mb-4
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[var(--text-primary)] [&_h3]:mt-8 [&_h3]:mb-2
            [&_p]:text-[var(--text-secondary)] [&_p]:leading-relaxed [&_p]:my-4
            [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--primary)] [&_blockquote]:bg-[var(--surface)] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:rounded-r-lg [&_blockquote]:my-6
            [&_blockquote_p]:text-[var(--text-secondary)] [&_blockquote_p]:italic
            [&_code]:bg-[var(--surface-raised)] [&_code]:text-[var(--danger)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
            [&_pre]:bg-[#0E0E14] [&_pre]:text-white [&_pre]:rounded-lg [&_pre]:p-5 [&_pre]:overflow-x-auto [&_pre]:my-6
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-sm
            [&_th]:bg-[var(--surface-raised)] [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-3 [&_th]:text-xs [&_th]:font-bold [&_th]:text-left [&_th]:text-[var(--text-primary)]
            [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-3 [&_td]:text-[var(--text-secondary)]
            [&_a]:text-[var(--primary)] [&_a]:underline [&_a]:font-semibold
            [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-6
            [&_hr]:border-[var(--border)] [&_hr]:my-8
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:text-[var(--text-secondary)]
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:text-[var(--text-secondary)]
            [&_li]:my-1.5 [&_li]:leading-relaxed
            [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:my-6
          "
          dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
        />

        {/* FAQ accordion */}
        {blog.faqJsonld && blog.faqJsonld.length > 0 && (
          <section className="mt-12 pb-12 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6"
              style={{ fontFamily: 'var(--font-display)' }}>
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {blog.faqJsonld.map((item, i) => (
                <details key={i} className="group bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none hover:bg-[var(--surface-raised)] transition-colors list-none">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] pr-4">{item.question}</h3>
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Share */}
        <div className="flex items-center gap-3 py-8 border-b border-[var(--border)]">
          <span className="text-sm font-bold text-[var(--text-muted)]">Share:</span>
          <ShareButtons title={blog.title} />
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6"
              style={{ fontFamily: 'var(--font-display)' }}>
              Related Posts
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/blogs/${r.slug}`}
                  className="group bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-all block"
                >
                  {r.coverImage && (
                    <div className="relative w-full h-32 bg-[var(--surface-raised)]">
                      <img src={r.coverImage} alt={r.coverImageAlt || r.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {r.title}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold mt-2">{r.readingTimeMinutes || '?'} min read</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div className="mt-16 p-8 bg-[var(--primary)] rounded-[var(--radius-lg)] text-center space-y-4 shadow-[var(--shadow-primary)]">
          <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to find your right property?
          </h2>
          <p className="text-white/80 text-sm max-w-md mx-auto">
            No brokerage. No spam calls. Just expert guidance from your channel partner.
          </p>
          <Link href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--primary)] text-sm font-black rounded-[var(--radius)] hover:opacity-90 transition-opacity"
          >
            Start Exploring →
          </Link>
        </div>
      </article>
    </div>
  );
}
