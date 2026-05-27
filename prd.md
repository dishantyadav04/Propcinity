# Propcinity — Cleanup & Hardening Prompt

Make all changes below exactly as described.
Test after each section. Do not change any API route logic.

==========================================================
FIX 1 — ADMIN AUTH: ask password once, persist via cookie
==========================================================

The current layout already checks `document.cookie.includes('admin_session=')`.
The bug is that the cookie check runs client-side AFTER React hydrates,
causing a flash where it re-shows the login form briefly on navigation.

The cookie is set with `maxAge: 60 * 60 * 24 * 7` (7 days) in the auth route.
The real problem is the middleware is missing — without it, Next.js renders
every admin page SSR without knowing the cookie exists, so the page briefly
flickers to the login form on every navigation.

Fix by adding a middleware that redirects unauthenticated users at the edge:

CREATE middleware.ts in the project root (same level as package.json):

import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin routes — NOT /api/admin (those check their own auth)
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('admin_session')

    // If no cookie, redirect to /admin/login
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/admin/login', request.url)
      // Pass the original path so we can redirect back after login
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

Now create a dedicated login page so there is no login form embedded
in the layout:

CREATE app/admin/login/page.tsx:

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/admin';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace(from);
    } else {
      setError('Incorrect password. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[var(--primary)] rounded-2xl flex items-center
            justify-center text-white font-black text-3xl mx-auto shadow-[var(--shadow-primary)]">
            P
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Prop<span className="text-[var(--primary)]">cinity</span> Admin
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Enter your admin password to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
              rounded-[var(--radius)] text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]
              transition-colors"
          />
          {error && (
            <p className="text-sm text-[var(--danger)] font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full py-3 bg-[var(--primary)] text-white font-black
              rounded-[var(--radius)] disabled:opacity-50 transition-opacity
              hover:opacity-90 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Enter Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

Now simplify app/admin/layout.tsx — remove ALL login form logic.
The middleware handles unauthenticated users. Layout just renders:

Replace app/admin/layout.tsx entirely with:

import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

IMPORTANT: The login page at /admin/login must be EXCLUDED from the
middleware matcher, otherwise it would redirect to itself in a loop.
The matcher '/admin/:path*' matches /admin/login too.

Update middleware.ts matcher and add an exception:

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    // Never intercept the login page itself
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

Also add a logout route. Open components/admin/Sidebar.tsx.
Find the logout button click handler:
  document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  window.location.href = '/admin';

Replace with:
  document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  window.location.href = '/admin/login';

==========================================================
FIX 2 — FAVICON: add site icon
==========================================================

Next.js App Router supports favicon via special files in the /app folder.
The simplest approach that works everywhere:

CREATE app/favicon.ico — put any .ico file here.
CREATE app/icon.tsx — this generates a favicon programmatically:

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#FF4500',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          fontSize: 20,
          fontFamily: 'sans-serif',
        }}
      >
        P
      </div>
    ),
    { ...size }
  )
}

CREATE app/apple-icon.tsx — for Apple devices (180×180):

import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#FF4500',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          fontSize: 110,
          fontFamily: 'sans-serif',
        }}
      >
        P
      </div>
    ),
    { ...size }
  )
}

Also update app/layout.tsx metadata to add manifest and theme color:

Find the metadata export and update it:

export const metadata: Metadata = {
  title: 'Propcinity | Zero Brokerage Real Estate',
  description: 'Find the right property in Pune. AI-powered matches. Zero brokerage. Verified projects.',
  keywords: ['real estate', 'Pune property', 'zero brokerage', 'buy flat Pune'],
  authors: [{ name: 'Propcinity' }],
  creator: 'Propcinity',
  metadataBase: new URL('https://propcinity.in'),
  openGraph: {
    title: 'Propcinity | Zero Brokerage Real Estate',
    description: 'Find the right property in Pune. AI-powered matches. Zero brokerage.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Propcinity | Zero Brokerage Real Estate',
  },
}

==========================================================
FIX 3 — UPDATE PACKAGES to latest stable versions
==========================================================

Open package.json and update dependencies to these exact versions.
After updating, run: npm install

{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.99.0",
    "@aws-sdk/client-s3": "^3.785.0",
    "@aws-sdk/lib-storage": "^3.785.0",
    "@supabase/ssr": "^0.10.3",
    "@supabase/supabase-js": "^2.106.2",
    "@types/leaflet": "^1.9.16",
    "@types/node": "^22.15.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "autoprefixer": "^10.4.21",
    "clsx": "^2.1.1",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^12.40.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.511.0",
    "next": "^15.3.2",
    "openai": "^4.100.0",
    "pg": "^8.16.0",
    "postcss": "^8.5.3",
    "posthog-js": "^1.376.2",
    "posthog-node": "^4.17.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.56.4",
    "react-leaflet": "^5.0.0",
    "resend": "^4.5.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.0",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vaul": "^1.1.2",
    "zod": "^3.25.28"
  }
}

IMPORTANT: After running npm install, run npm run build immediately.
If react-leaflet 5.x causes type errors (it had breaking changes from 4.x),
pin it back to "^4.2.1" — do NOT upgrade react-leaflet if it breaks maps.
Same for framer-motion 12.x — if it breaks AnimatePresence usage, keep "^11.18.2".
Priority: site must build. Latest version is secondary.

==========================================================
FIX 4 — REMOVE SCORE/TRUST/RISK REMNANTS from admin pages
==========================================================

The scoring system was removed from the public-facing site but
admin pages still reference builder_score, trust_score, and risk_label.
These are fine to KEEP in admin (admin needs to see scores for managing
data), but the "Avg Trust Score" ring on the overview page should be
removed since trust scores are no longer part of the system.

--- app/admin/page.tsx ---

Remove avgTrustScore from the Stats interface:
  Remove: avgTrustScore: number;

Remove avgTrustScore calculation:
  Remove the line:
    avgTrustScore: projects.length ? Math.round(...) : 0,

Remove the entire "Avg Trust Score" card (the SVG ring section):
Find this block and delete it entirely:
  {/* Avg trust score */}
  <div className="bg-white border ... text-center">
    <p ...>Avg Trust Score</p>
    <div className="relative w-24 h-24 ...">
      <svg ...>...</svg>
      ...
    </div>
    <p ...>across all projects</p>
  </div>

Replace the grid that had "Lead intent breakdown + Avg trust" (lg:grid-cols-3)
with just the lead intent breakdown taking full width (lg:grid-cols-1):
Find:
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
Replace with:
  <div className="grid grid-cols-1 gap-4">

--- app/admin/builders/page.tsx ---

Keep builder_score display — admin SHOULD see builder scores.
No changes needed here. Builder scores are an internal admin tool,
not shown to public users. This is correct behaviour.

--- app/admin/builders/[id]/page.tsx ---

Same — keep builder_score and trust_score in the builder detail page.
Admin needs this to manage scoring data.
No changes needed.

--- lib/schema.sql ---

UPDATE the projects_public view to:
1. Remove commission_rate (it's not in the view but confirm)
2. Remove trust_score and risk_label (no longer part of system)
3. Add the new fields from the updated Project type

Find the existing view definition:
  create view projects_public as
    select
      id, slug, name, builder_name, builder_score, builder_logo,
      location, city, lat, lng, tagline, description,
      trust_score, risk_label, rera_id, rera_expiry,
      launch_date, possession_date, total_units, available_units,
      pros, cons, amenities, images,
      construction_status, construction_percent,
      is_published, created_at, updated_at
    from projects
    where is_published = true;

Replace with:
  -- Drop and recreate to update column list
  drop view if exists projects_public;

  create view projects_public as
    select
      id, slug, name,
      builder_name, builder_logo,
      builder_years_experience, builder_completed_projects,
      builder_cities, builder_top_projects, builder_description,
      location, city, lat, lng, tagline, description,
      rera_id, rera_expiry, rera_link,
      launch_date, possession_date, rera_possession_date,
      land_parcel_acres, total_towers, floors_per_tower,
      total_units, available_units,
      pros, cons, amenities, internal_amenities, external_amenities,
      images, videos, brochure_url,
      construction_status, construction_percent,
      litigation, litigation_details,
      commencement_certificate, occupancy_certificate,
      payment_plans, bank_approvals,
      is_published, created_at, updated_at
      -- commission_rate is deliberately excluded
      -- trust_score, risk_label, builder_score are deliberately excluded
    from projects
    where is_published = true;

  comment on view projects_public is
    'Public project view. commission_rate, trust_score, risk_label,
     builder_score are intentionally excluded for security.';

Run this SQL in your Supabase SQL editor after updating schema.sql.
This confirms commission_rate is excluded and documents it with a comment.

==========================================================
FIX 5 — PROJECT PAGE: verify no score references reach users
==========================================================

Open app/projects/[slug]/page.tsx.

Search the file for any of these strings and remove if found:
- trustScore
- TrustScoreBadge
- builderScore
- builder_score
- riskLabel
- risk_label

If the file currently has an import like:
  import TrustScoreBadge from "@/components/property/TrustScoreBadge"
Remove that import line entirely.

If there is any JSX like:
  <TrustScoreBadge score={project.trustScore} ... />
Remove that JSX block entirely.

If the overview grid shows a "Trust Score" or "Risk" row, remove it.
The overview grid should only show: Land Parcel, Towers, Floors, Config,
Area, RERA NO., Possession, Target Possession, RERA Possession, Litigation.

If builderScore is rendered anywhere on the page, remove it.
The builder section should show: name, logo, years experience, completed
projects, description, top projects — no score number.

==========================================================
FIX 6 — ProjectCard: ensure no score renders
==========================================================

Open components/property/ProjectCard.tsx.

Check for and remove:
1. Any import of TrustScoreBadge
2. Any usage of <TrustScoreBadge ... />
3. Any reference to project.trustScore or project.riskLabel
   in the image overlay area (badges at top-left/top-right/bottom)

The ONLY overlays allowed inside the image area of ProjectCard are:
- Gradient overlay (the dark bottom fade)
- Project name + location at bottom-left
- Nothing else (no risk badge, no trust score, no match %)

The dashboard page adds its own risk+remove overlay OUTSIDE the card.
The card itself renders no badges inside the image.

==========================================================
FIX 7 — REMOVE TrustScoreBadge component (optional cleanup)
==========================================================

If TrustScoreBadge is no longer imported anywhere after fixes above,
you can delete components/property/TrustScoreBadge.tsx entirely.

First verify it is not imported anywhere:
Run a search for "TrustScoreBadge" across all .tsx files.
If zero results: delete the file.
If any results: fix those imports first, then delete.

==========================================================
VERIFY CHECKLIST
==========================================================

After making all changes run: npm run build

Then test manually:

ADMIN AUTH:
[ ] Visit /admin directly (not logged in) → redirected to /admin/login
[ ] Enter wrong password → shows error, stays on login page
[ ] Enter correct password → redirected to /admin, stays logged in
[ ] Navigate between /admin, /admin/builders, /admin/leads WITHOUT
    seeing the password form again — it should NOT appear on every page
[ ] After 7 days (or clear cookies) → redirected to /admin/login again
[ ] Logout button → redirects to /admin/login

FAVICON:
[ ] Browser tab shows orange "P" icon
[ ] Bookmark shows the icon
[ ] Mobile homescreen shows the icon

PACKAGES:
[ ] npm run build completes with zero errors after package update
[ ] No TypeScript errors from updated packages
[ ] Maps still work (react-leaflet)
[ ] Animations still work (framer-motion)

SCORE REMNANTS:
[ ] Visit /projects/any-slug → NO trust score displayed anywhere
[ ] Visit /projects/any-slug → NO risk badge (low/medium/high) displayed anywhere
[ ] Visit /projects/any-slug → Builder section shows no score number
[ ] Visit /dashboard → NO trust score badge on any card
[ ] Project cards on explorer → NO trust score badge visible
[ ] /admin/builders → Builder score still visible (this is correct — admin sees it)
[ ] /admin/builders/[id] → Trust score of linked projects still visible (admin only)

COMMISSION RATE:
[ ] GET /api/projects response in browser devtools → no commission_rate field
[ ] Supabase projects_public view has a comment confirming exclusion
[ ] Schema.sql updated with new view definition