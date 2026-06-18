export interface BlogFaqItem {
  question: string
  answer: string
}

export interface Blog {
  id: string
  slug: string
  title: string
  excerpt?: string
  contentHtml: string
  contentJson?: unknown
  coverImage?: string
  coverImageAlt?: string
  authorName: string
  authorAvatar?: string
  category?: string
  tags: string[]
  status: 'draft' | 'published' | 'scheduled'
  publishedAt?: string
  scheduledAt?: string
  readingTimeMinutes?: number
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  ogImage?: string
  faqJsonld?: BlogFaqItem[]
  keywords: string[]
  viewCount: number
  createdAt: string
  updatedAt: string
}
