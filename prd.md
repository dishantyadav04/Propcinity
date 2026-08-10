# Prompt for Cursor: Apply SEO Fixes + Rename Terms Page (with exact code)

Paste this whole file into Cursor's chat/composer with the `Propcinity-main` repo open. Every snippet below is a **verified, working change** — I applied and tested each one in a clean checkout before writing this. Apply them in order, file by file. Where I say "Add" or "Replace", use Cursor's ability to open the file and make the exact edit — don't improvise the wording.

After all edits: run `npx tsc --noEmit` and fix anything that doesn't compile, then `npm run build`.

---

## PART A — Rename `/terms` to `/terms-and-conditions`

### A1. Rename the route folder
```bash
git mv app/terms app/terms-and-conditions
```
The page component itself (`app/terms-and-conditions/page.tsx`) needs **no internal changes** — its visible heading already reads "Terms & Conditions", only the URL segment changes.

### A2. Add a permanent redirect from the old URL
**File:** `next.config.mjs`
**Replace:**
```js
  compress: true,

  async headers() {
```
**With:**
```js
  compress: true,

  async redirects() {
    return [
      {
        source: '/terms',
        destination: '/terms-and-conditions',
        permanent: true,
      },
    ]
  },

  async headers() {
```

### A3. Update every internal link from `/terms` to `/terms-and-conditions`

**File:** `components/layout/BottomNav.tsx`
**Replace:**
```tsx
    pathname === '/terms' ||
```
**With:**
```tsx
    pathname === '/terms-and-conditions' ||
```

**File:** `components/layout/Footer.tsx`
**Replace:**
```tsx
const NO_BOTTOM_NAV_ROUTES = ['/', '/onboarding', '/privacy', '/terms', '/cookies']
```
**With:**
```tsx
const NO_BOTTOM_NAV_ROUTES = ['/', '/onboarding', '/privacy', '/terms-and-conditions', '/cookies']
```
**Also replace:**
```tsx
              <li><Link href="/terms" className={linkClass}>Terms</Link></li>
```
**With:**
```tsx
              <li><Link href="/terms-and-conditions" className={linkClass}>Terms &amp; Conditions</Link></li>
```

**File:** `components/onboarding/UserIntentForm.tsx`
Find the `href="/terms"` (around line 785) and change it to `href="/terms-and-conditions"`.

**File:** `app/auth/signup/page.tsx`
**Replace:**
```tsx
          <Link href="/terms" className="underline">Terms</Link> and{' '}
```
**With:**
```tsx
          <Link href="/terms-and-conditions" className="underline">Terms</Link> and{' '}
```
(Label text "Terms" stays short here — it's an inline consent sentence, not a nav link.)

**File:** `app/auth/phone/page.tsx`
**Replace:**
```tsx
            <Link href="/terms" className="underline hover:text-[var(--primary)]">Terms</Link>
```
**With:**
```tsx
            <Link href="/terms-and-conditions" className="underline hover:text-[var(--primary)]">Terms</Link>
```

**File:** `app/profile/page.tsx`
Find `href="/terms"` (around line 241) and change it to `href="/terms-and-conditions"`. The visible label already says "Terms & Conditions" — no text change needed.

**File:** `app/contact/page.tsx`
**Replace:**
```tsx
            <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Terms</Link>
```
**With:**
```tsx
            <Link href="/terms-and-conditions" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Terms &amp; Conditions</Link>
```

**File:** `app/cookies/page.tsx`
**Replace:**
```tsx
            <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms & Conditions</Link>
```
**With:**
```tsx
            <Link href="/terms-and-conditions" className="text-[var(--primary)] hover:underline">Terms & Conditions</Link>
```

**File:** `app/privacy/page.tsx`
**Replace:**
```tsx
            <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms & Conditions</Link>
```
**With:**
```tsx
            <Link href="/terms-and-conditions" className="text-[var(--primary)] hover:underline">Terms & Conditions</Link>
```

### A4. Update the sitemap entry
**File:** `app/sitemap.ts`
**Replace:**
```ts
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
```
**With:**
```ts
    { url: `${BASE_URL}/terms-and-conditions`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
```

After this part, grep the whole repo for any remaining `/terms` references that may have been missed (there shouldn't be any, but double-check auto-generated content or CMS seed data):
```bash
grep -rn "'/terms'\|\"/terms\"\|/terms\`" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v terms-and-conditions
```

---

## PART B — Canonical tags site-wide

### B1. Add the shared helper
**New file:** `lib/seo.ts`
```ts
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'

/**
 * Builds an absolute canonical URL for a given site path.
 * Usage: canonicalUrl('/about') -> 'https://propcinity.in/about'
 */
export function canonicalUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return normalizedPath === '/' ? BASE_URL : `${BASE_URL}${normalizedPath}`
}
```

### B2. Homepage
**File:** `app/layout.tsx`
**Replace:**
```tsx
import PostHogProvider from '@/components/analytics/PostHogProvider'
import PostHogPageView from '@/components/analytics/PostHogPageView'
```
**With:**
```tsx
import PostHogProvider from '@/components/analytics/PostHogProvider'
import PostHogPageView from '@/components/analytics/PostHogPageView'
import { canonicalUrl } from '@/lib/seo'
```

**Also replace:**
```tsx
  keywords: ['real estate', 'Pune property', 'zero brokerage', 'buy flat Pune'],
  authors: [{ name: 'Propcinity' }],
  creator: 'Propcinity',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'),
```
**With:**
```tsx
  keywords: ['real estate', 'Pune property', 'zero brokerage', 'buy flat Pune'],
  authors: [{ name: 'Propcinity' }],
  creator: 'Propcinity',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'),
  alternates: {
    canonical: canonicalUrl('/'),
  },
```

### B3. The five existing metadata layouts
Each of these files follows the identical structure — add the import and the `alternates` block.

**File:** `app/about/layout.tsx` — full replacement:
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About Propcinity — Your Real Estate Channel Partner in Pune',
  description: "Propcinity uses AI to curate property matches and negotiates with developers on your behalf as your channel partner — at zero cost to buyers.",
  alternates: {
    canonical: canonicalUrl('/about'),
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**File:** `app/explore/layout.tsx` — full replacement:
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Explore Properties in Pune — AI-Curated Shortlist',
  description: "Tell us your budget and preferences. Propcinity's AI narrows thousands of Pune listings to a curated shortlist with Match % scoring and RERA verification.",
  alternates: {
    canonical: canonicalUrl('/explore'),
  },
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**File:** `app/faq/layout.tsx` — full replacement:
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — Propcinity',
  description: "Is Propcinity free? How does Match % work? Do you negotiate on my behalf? Get clear answers about how Propcinity's channel-partner model works.",
  alternates: {
    canonical: canonicalUrl('/faq'),
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**File:** `app/compare/layout.tsx` — full replacement:
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Compare Properties Side by Side — Propcinity',
  description: 'Compare Match %, price, RERA status, amenities, and construction progress across your shortlisted Pune properties in one view.',
  alternates: {
    canonical: canonicalUrl('/compare'),
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**File:** `app/ai-chat/layout.tsx` — full replacement:
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: "Ask Propcinity's AI About Any Property in Pune",
  description: "Get honest, data-backed answers about Pune properties using RERA data and AI — no brochures, no sales calls.",
  alternates: {
    canonical: canonicalUrl('/ai-chat'),
  },
}

export default function AIChatLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

---

## PART C — Fix duplicate titles/descriptions on contact, privacy, terms, cookies

These four pages are `'use client'` components with no `layout.tsx`, so they currently inherit the homepage's title. Create four new files (don't touch the `page.tsx` files themselves).

**New file:** `app/contact/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Contact Propcinity — Get in Touch',
  description: 'Have a question, feedback, or partnership inquiry about Pune real estate? Message the Propcinity team and we\'ll respond within 24 hours.',
  alternates: {
    canonical: canonicalUrl('/contact'),
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**New file:** `app/privacy/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Privacy Policy — Propcinity',
  description: 'How Propcinity collects, uses, and protects your personal data under India\'s DPDPA 2023, including what we share with developers and data processors.',
  alternates: {
    canonical: canonicalUrl('/privacy'),
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**New file:** `app/terms-and-conditions/layout.tsx`
(Create this *after* Part A's folder rename.)
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Propcinity',
  description: 'The terms governing your use of Propcinity, our zero-brokerage channel-partner model, and how we work with buyers and developers in Pune.',
  alternates: {
    canonical: canonicalUrl('/terms-and-conditions'),
  },
}

export default function TermsAndConditionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**New file:** `app/cookies/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Cookie Policy — Propcinity',
  description: 'The cookies and storage keys Propcinity uses, why we use them, and how to manage your cookie preferences.',
  alternates: {
    canonical: canonicalUrl('/cookies'),
  },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

---

## PART D — Fix `/compare` duplicate H1

**File:** `app/compare/page.tsx`
The `sr-only` block around line 154 (`<h1>Compare properties side by side…</h1>`) stays untouched — it's the intended single H1. The **visible** heading in the sticky header (~line 168) must be demoted.

**Replace:**
```tsx
          <h1 className="font-black text-[var(--text-primary)] text-lg flex-1"
            style={{ fontFamily: 'var(--font-display)' }}>
            Comparing {projects.length} Project{projects.length !== 1 ? 's' : ''}
          </h1>
```
**With:**
```tsx
          <h2 className="font-black text-[var(--text-primary)] text-lg flex-1"
            style={{ fontFamily: 'var(--font-display)' }}>
            Comparing {projects.length} Project{projects.length !== 1 ? 's' : ''}
          </h2>
```

---

## PART E — Fix `/onboarding` missing H1

**File:** `components/onboarding/UserIntentForm.tsx`
Add a visually-hidden H1 right at the top of the returned JSX, above the existing sticky progress header. Don't touch anything else in the render tree — the existing `<h2>` step headings stay as `<h2>`.

**Replace:**
```tsx
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[var(--border)] px-4 sm:px-6 py-3">
```
**With:**
```tsx
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <h1 className="sr-only">Tell us what you&apos;re looking for</h1>
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[var(--border)] px-4 sm:px-6 py-3">
```

---

## PART F — Add `llms.txt`

**New file:** `app/llms.txt/route.ts`
(Yes, a folder literally named `llms.txt` — Next.js App Router treats the folder name as the literal URL segment, same pattern as `sitemap.xml`.)
```ts
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'

export async function GET() {
  const body = `# Propcinity

> Propcinity is a buyer-side real estate channel partner for Pune, India. We are not a listings site — we use AI to curate a shortlist of properties that actually fit a buyer's budget and preferences, verify RERA status, score builder trust, and negotiate with developers on the buyer's behalf. The service is free for buyers; developers pay us, not the other way around.

## Key facts
- Zero brokerage for buyers — Propcinity is compensated by developers, not homebuyers.
- AI Match % scoring narrows thousands of listings down to a relevant shortlist based on stated budget, purpose, and preferences.
- Every listed project is RERA-verified.
- Propcinity acts as the buyer's channel partner through to possession, not just at the point of sale.
- Operating market: Pune, Maharashtra, India.

## Key pages
- [Homepage](${BASE_URL}/): Overview of the Propcinity model.
- [Explore](${BASE_URL}/explore): AI-curated property shortlist and search.
- [Compare](${BASE_URL}/compare): Side-by-side comparison of shortlisted properties.
- [Blog](${BASE_URL}/blogs): Guides and neighborhood insights for Pune homebuyers.
- [About](${BASE_URL}/about): How the channel-partner model works.
- [FAQ](${BASE_URL}/faq): Common questions about pricing, Match %, and the buying process.
- [Contact](${BASE_URL}/contact): Get in touch with the Propcinity team.

## Sitemap
${BASE_URL}/sitemap.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
```

---

## PART G — Fix missing/empty `alt` text (admin panel, low priority — do anytime)

**File:** `app/admin/projects/page.tsx`
**Replace:**
```tsx
                      {project.images?.[0] && (
                        <img src={project.images[0]} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
                      )}
```
**With:**
```tsx
                      {project.images?.[0] && (
                        <img src={project.images[0]} alt={project.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
                      )}
```

**File:** `app/admin/blogs/page.tsx`
**Replace:**
```tsx
                      <img src={blog.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
```
**With:**
```tsx
                      <img src={blog.coverImage} alt={blog.title} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
```

**File:** `components/admin/ImageUpload.tsx`
**Replace:**
```tsx
interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string[];
  onRemove: (url: string) => void;
}

export default function ImageUpload({ onUpload, value = [], onRemove }: ImageUploadProps) {
```
**With:**
```tsx
interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string[];
  onRemove: (url: string) => void;
  /** Used to build descriptive alt text, e.g. "Project Gallery". Defaults to "Uploaded image". */
  label?: string;
}

export default function ImageUpload({ onUpload, value = [], onRemove, label = 'Uploaded image' }: ImageUploadProps) {
```

**Also in the same file, replace:**
```tsx
        {value.map((url) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border)] group">
            <img src={url} className="w-full h-full object-cover" />
```
**With:**
```tsx
        {value.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border)] group">
            <img src={url} alt={`${label} ${index + 1}`} className="w-full h-full object-cover" />
```

**File:** `components/admin/ProjectForm.tsx`
Three call sites need the new `label` prop added.

**Replace:**
```tsx
        <ImageUpload
          value={project.images}
          onUpload={(url) => setProject({...project, images: [...(project.images || []), url]})}
          onRemove={(url) => setProject({...project, images: project.images?.filter(i => i !== url)})}
        />
```
**With:**
```tsx
        <ImageUpload
          value={project.images}
          onUpload={(url) => setProject({...project, images: [...(project.images || []), url]})}
          onRemove={(url) => setProject({...project, images: project.images?.filter(i => i !== url)})}
          label="Project Gallery"
        />
```

**Replace:**
```tsx
        <ImageUpload
          onUpload={(url) => setProject(prev => ({...prev, masterPlanImages: [...(prev.masterPlanImages || []), url]}))}
          onRemove={(url) => setProject(prev => ({...prev, masterPlanImages: (prev.masterPlanImages || []).filter(i => i !== url)}))}
          value={project.masterPlanImages || []}
        />
```
**With:**
```tsx
        <ImageUpload
          onUpload={(url) => setProject(prev => ({...prev, masterPlanImages: [...(prev.masterPlanImages || []), url]}))}
          onRemove={(url) => setProject(prev => ({...prev, masterPlanImages: (prev.masterPlanImages || []).filter(i => i !== url)}))}
          value={project.masterPlanImages || []}
          label="Master Plan Image"
        />
```

**Replace:**
```tsx
        <ImageUpload
          onUpload={(url) => setProject(prev => ({...prev, floorPlanImages: [...(prev.floorPlanImages || []), url]}))}
          onRemove={(url) => setProject(prev => ({...prev, floorPlanImages: (prev.floorPlanImages || []).filter(i => i !== url)}))}
          value={project.floorPlanImages || []}
        />
```
**With:**
```tsx
        <ImageUpload
          onUpload={(url) => setProject(prev => ({...prev, floorPlanImages: [...(prev.floorPlanImages || []), url]}))}
          onRemove={(url) => setProject(prev => ({...prev, floorPlanImages: (prev.floorPlanImages || []).filter(i => i !== url)}))}
          value={project.floorPlanImages || []}
          label="Floor Plan Image"
        />
```

---

## PART H — Server-render `/projects/[slug]`, `/explore`, `/blogs` (biggest remaining item)

This is a genuine refactor, not a find-and-replace — the exact JSX in each file is too large (1000+ lines for the project detail page) to hand over as a literal before/after block safely. Do this one with Cursor's help interactively rather than blind copy-paste, using this exact plan:

### H1. `/projects/[slug]` — highest priority
1. Rename the current `app/projects/[slug]/page.tsx` content into a new file `components/property/ProjectDetailClient.tsx`, keep `'use client'` at the top, and change its signature to accept `project: Project` as a prop instead of reading `useParams()` + fetching it. Delete the `useEffect` block that does `fetch(\`/api/projects/${slug}\`)` and the `isLoading`/`notFound` state tied to that fetch — the parent Server Component will handle the not-found case. Keep every other `useState`/`useEffect` (save state, guest mode, tabs, gallery, AI modal, etc.) unchanged.
2. Create a new `app/projects/[slug]/page.tsx`:
   ```tsx
   import { notFound } from 'next/navigation'
   import { getProjectBySlug } from '@/services/projects'
   import ProjectDetailClient from '@/components/property/ProjectDetailClient'

   export async function generateStaticParams() {
     // Reuse whatever slug-listing function already exists in services/projects.ts
     // (e.g. getPublishedProjects) — map to { slug: p.slug }
   }

   export default async function ProjectDetailPage({
     params,
   }: {
     params: Promise<{ slug: string }>
   }) {
     const { slug } = await params
     const project = await getProjectBySlug(slug)
     if (!project) notFound()
     return <ProjectDetailClient project={project} />
   }
   ```
3. Leave `app/projects/[slug]/layout.tsx` (the `generateMetadata` file) exactly as-is — it already does its own server-side `getProjectBySlug` call for metadata purposes; that's a small duplicate fetch and is an acceptable tradeoff.
4. Run `npx tsc --noEmit` and fix every prop-typing error that surfaces in `ProjectDetailClient.tsx` — there will be several since `project` is now a required prop instead of nullable state.

### H2. `/explore`
1. Create `components/property/ExploreClient.tsx` containing everything currently in `app/explore/page.tsx`, changed to accept `initialProjects: Project[]` as a prop and use it as the initial value for the `projects` state, instead of starting from `[]` and fetching in `useEffect`.
2. New `app/explore/page.tsx`:
   ```tsx
   import { getPublishedProjects } from '@/services/projects'
   import ExploreClient from '@/components/property/ExploreClient'

   export default async function ExplorePage() {
     const initialProjects = await getPublishedProjects({})
     return <ExploreClient initialProjects={initialProjects} />
   }
   ```
3. If the existing client code has a live "refetch on filter change" call to `/api/projects`, leave that API-route call in place for filtering — only the **initial** load needs to be server-rendered.

### H3. `/blogs` (listing page)
Same pattern as H2: split into `components/blogs/BlogListClient.tsx` (accepts `initialBlogs`) and a Server Component `app/blogs/page.tsx` that calls `getPublishedBlogs(1, <pageSize>)` server-side. Keep the "load more" pagination fetch client-side.

---

## PART I — Bundle size (do last, measure first)

1. Get a real baseline: `npm install`, fill in `.env` from `.env.example`, run `npm run build`, note the per-route JS sizes Next.js prints.
2. **`components/analytics/PostHogProvider.tsx`**: change the static `import posthog from 'posthog-js'` at the top of the file to a dynamic `const posthog = (await import('posthog-js')).default` inside the existing `useEffect` that calls `posthog.init(...)`. Keep the `initStarted`/`initialPageviewFired` module-level flags exactly as they are — they guard against Strict Mode double-mounting and must still work with the dynamic import.
3. **`app/page.tsx`** (homepage): review which `framer-motion` usages are simple fade/slide-in-on-mount (e.g. `StatCard`, hero text) vs. anything needing real gesture/drag support. For the simple ones, replace with a small CSS-only `FadeIn` wrapper component and drop the `framer-motion` import from `app/page.tsx` if nothing else in that file needs it.
4. Re-run `npm run build` and compare route sizes to the baseline from step 1.

---

## PART J — Fix OG image to use Propcinity's actual brand (not KaleKure's)

**Root cause:** `app/opengraph-image.tsx` was built with a dark forest-green palette (`#0D2B1A`, `#22C55E`, `#a7f3d0`) — that's your **KaleKure** brand, not Propcinity. The live site (`app/globals.css`) actually uses a warm off-white background with a coral/orange primary:

```css
--background: #FAFAF8;
--surface: #FFFFFF;
--primary: #FF4500;
--primary-light: #FFF1EC;
--text-primary: #141414;
--text-secondary: #525252;
```

Confirmed proof this is a real mismatch, not a stylistic choice: `app/icon.tsx` (your favicon) already correctly uses `#FF4500` on white — only the OG image drifted onto the wrong palette. Fonts are also wrong — the old file used generic `Arial, sans-serif` instead of the site's actual `Syne` (headings) + `Plus Jakarta Sans` (body) from `app/layout.tsx`.

`next/og`'s `ImageResponse` can't use `next/font` directly — it needs raw font bytes, so the fix fetches Syne/Plus Jakarta Sans from Google Fonts at request time (this is the standard, documented pattern for `ImageResponse`, and works fine on Vercel Edge — it just isn't something I can test from a sandboxed environment without outbound access to `fonts.googleapis.com`).

**File:** `app/opengraph-image.tsx` — full replacement:
```tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Propcinity — Find the Right Property in Pune'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Propcinity's actual brand tokens (app/globals.css) — do not substitute other palettes.
const COLORS = {
  background: '#FAFAF8', // --background
  surface: '#FFFFFF', // --surface
  border: 'rgba(20, 20, 20, 0.08)', // --border
  primary: '#FF4500', // --primary
  primaryLight: '#FFF1EC', // --primary-light
  textPrimary: '#141414', // --text-primary
  textSecondary: '#525252', // --text-secondary
  textMuted: '#A3A3A3', // --text-muted
}

async function loadGoogleFont(family: string, weight: number, text: string) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(cssUrl)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/)
  if (match) {
    const fontUrl = match[1]
    const res = await fetch(fontUrl)
    if (res.ok) return res.arrayBuffer()
  }
  throw new Error(`Failed to load font: ${family} ${weight}`)
}

export default async function Image() {
  const headline = 'Propcinity'
  const tagline1 = "We don't show more properties."
  const tagline2 = 'We help you choose the right one.'
  const eyebrow = 'ZERO BROKERAGE · AI-POWERED · MATCH % SCORING'

  const [syneBold, jakartaMedium, jakartaSemibold] = await Promise.all([
    loadGoogleFont('Syne', 800, headline),
    loadGoogleFont('Plus Jakarta Sans', 500, `${tagline1}${tagline2}www.propcinity.in`),
    loadGoogleFont('Plus Jakarta Sans', 700, eyebrow),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: COLORS.background,
          padding: '0 96px',
          position: 'relative',
        }}
      >
        {/* Eyebrow pill — mirrors the hero badge on propcinity.in */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 20px',
            background: COLORS.primaryLight,
            color: COLORS.primary,
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'Jakarta-Bold',
            borderRadius: 999,
            border: `1px solid ${COLORS.primary}33`,
            marginBottom: 36,
            letterSpacing: '0.02em',
          }}
        >
          {eyebrow}
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            fontSize: 108,
            fontWeight: 800,
            fontFamily: 'Syne-Bold',
            color: COLORS.textPrimary,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          {headline}
          <span style={{ color: COLORS.primary }}>.</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 34,
            fontWeight: 500,
            fontFamily: 'Jakarta-Medium',
            color: COLORS.textSecondary,
            lineHeight: 1.4,
            marginBottom: 44,
          }}
        >
          <span>{tagline1}</span>
          <span>{tagline2}</span>
        </div>

        {/* URL footer, styled like a subtle site chrome element */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            fontWeight: 500,
            fontFamily: 'Jakarta-Medium',
            color: COLORS.primary,
          }}
        >
          www.propcinity.in
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Syne-Bold', data: syneBold, weight: 800, style: 'normal' },
        { name: 'Jakarta-Medium', data: jakartaMedium, weight: 500, style: 'normal' },
        { name: 'Jakarta-Bold', data: jakartaSemibold, weight: 700, style: 'normal' },
      ],
    }
  )
}
```

**Design notes — why it's built this way:**
- Layout mirrors the actual homepage hero: a pill-shaped eyebrow badge in `--primary-light`/`--primary` (same as the "Trusted by Pune homebuyers · Zero brokerage" badge on `/`), a large black `Syne` wordmark with a coral accent dot (same visual trick the hero headline uses), and coral used only as an accent color — never as a background fill, matching how `--primary` is used sparingly across the site rather than as a dominant color block.
- Background is the same warm off-white (`#FAFAF8`) as the live site's `body` background — not a dark card, since Propcinity's actual product is light-themed.
- The Google Fonts fetch only requests the exact glyphs used (`text=` param) to keep the edge function fast and the payload small — standard practice for `ImageResponse` font loading, not a corner-cutting shortcut.

**To verify after deploying:**
1. Visit `https://propcinity.in/opengraph-image` directly (or your preview URL) to see the raw generated PNG.
2. Paste your production URL into [Meta's Sharing Debugger](https://developers.facebook.com/tools/debug/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator) and force a re-scrape — WhatsApp/Facebook/Twitter aggressively cache old OG images per URL, so the old green card may keep showing until the cache is busted.
3. If the Google Fonts fetch ever fails in production (rare, but possible if `fonts.googleapis.com` is unreachable from your edge region), the build will throw rather than silently fall back to a wrong font — check Vercel function logs for `Failed to load font` if the image doesn't render.

---

## Final step

Update `SEO_REVIEW.md` in the repo root: flip each fixed check's status to ✅ and add one sentence per check describing what changed. Keep the file — don't delete it.