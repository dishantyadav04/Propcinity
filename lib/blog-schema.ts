import { z } from 'zod'

export const blogFaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})

export const blogSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, numbers, and hyphens only'),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(300).optional(),
  contentHtml: z.string().min(1),
  contentJson: z.unknown().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  coverImageAlt: z.string().optional(),
  authorName: z.string().min(1).default('Propcinity Team'),
  authorAvatar: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  publishedAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  readingTimeMinutes: z.number().int().positive().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(180).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  ogImage: z.string().url().optional().or(z.literal('')),
  faqJsonld: z.array(blogFaqItemSchema).optional(),
  keywords: z.array(z.string()).default([]),
})

export type BlogInput = z.infer<typeof blogSchema>
