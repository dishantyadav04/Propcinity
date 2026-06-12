# Propcinity — Security Remediation + Cookie Consent Prompt
**For:** Cursor IDE  
**Project:** Propcinity (Next.js + Supabase + shadcn/ui + Tailwind)  
**Brand tokens:** Primary `#22C55E` | Background `#0D2B1A` | Surface `#1a3a28` | Text Primary `#FFFFFF` | Text Muted `#6b9e7e` | Border `rgba(255,255,255,0.1)` | Font Display: Syne | Font Body: Plus Jakarta Sans

---

## HOW TO USE THIS FILE

Copy each **numbered task block** into a new Cursor chat. Each block is self-contained. Complete them in order — later tasks may reference files created by earlier ones. Do not skip tasks. Do not touch `middleware.ts` (the app uses `proxy.ts` for routing guards).

---

## TASK 1 — Fix: Proxy Admin Cookie Value Validation (Critical C-1)

```
You are working on a Next.js 14 app (App Router). The app uses proxy.ts instead of middleware.ts for routing — do NOT create or modify middleware.ts.

Fix a Critical security vulnerability in proxy.ts:

PROBLEM:
The admin guard in proxy.ts only checks that the admin_session cookie exists (non-empty string), but never validates its value cryptographically. Any non-empty cookie value bypasses the admin route guard.

FILE TO EDIT: proxy.ts

CURRENT CODE (lines ~47–51):
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

WHAT TO DO:
1. Import isAdminAuthenticated from @/lib/admin-auth at the top of proxy.ts
2. Replace the cookie existence check with the actual cryptographic validation:
   - Instead of checking sessionCookie?.value, call isAdminAuthenticated(request)
   - If it returns false, redirect to /admin/login with the ?from= param as before
3. Do not change any other logic in proxy.ts
4. Do not create middleware.ts

EXPECTED RESULT: Any request to /admin/* (except /admin/login) that does not have a valid, cryptographically verified admin_session cookie value is redirected to /admin/login.
```

---

## TASK 2 — Fix: Require Auth on AI POST Endpoint (Critical C-2)

```
You are working on a Next.js 14 app (App Router) using Supabase for auth.

Fix a Critical security vulnerability in the AI ask route:

PROBLEM:
POST /api/ai/ask does NOT require authentication. If a user is not logged in, the daily limit check is skipped entirely and the endpoint calls OpenAI anyway. Guests get unlimited AI calls at the app's cost. The rate limiter also silently disables itself when Redis is not configured.

FILE TO EDIT: app/api/ai/ask/route.ts

WHAT TO DO in the POST handler:
1. After the IP rate-limit check and schema validation (after the `parsed` check), add a mandatory auth gate:
   - Call createServerSupabaseClient()
   - If supabase is null, return 503 Service Unavailable
   - Call supabase.auth.getUser()
   - If user is null/undefined, return 401 { error: 'Authentication required' }
2. Move the getUserChatCount / incrementUserChatCount logic to use this guaranteed user object
3. Remove the optional `if (supabase) { ... }` wrapper — make auth non-optional for POST
4. Do not change the PUT handler (it already requires auth correctly)
5. Do not change any other files

EXPECTED RESULT: Unauthenticated requests to POST /api/ai/ask return 401. Only verified logged-in users can use the AI chat.
```

---

## TASK 3 — Fix: Admin Settings Key Whitelist (Critical C-3)

```
You are working on a Next.js 14 app (App Router).

Fix a Critical security vulnerability in the admin settings API:

PROBLEM:
PUT /api/admin/settings accepts any arbitrary body.key and upserts it directly to the database. There is no validation of what keys are allowed.

FILE TO EDIT: app/api/admin/settings/route.ts

WHAT TO DO:
1. Define a constant ALLOWED_SETTINGS_KEYS as a readonly Set of strings at the top of the file containing all valid setting keys the app actually uses. Look at how the settings table is queried in the codebase to determine the real keys. At minimum include: 'maintenance_mode', 'featured_project_id', 'lead_alert_email', 'contact_phone', 'whatsapp_number', 'site_tagline'
2. In the PUT handler, after checking body.key exists, validate it against ALLOWED_SETTINGS_KEYS:
   - If body.key is not in the set, return 400 { error: 'Invalid settings key' }
3. Also validate that body.value is present and is a string or number (not an object or array unless the key explicitly needs it)
4. Log the attempted invalid key server-side before returning the error
5. Do not change the GET handler

EXPECTED RESULT: Only known, whitelisted setting keys can be upserted. Arbitrary key injection is blocked.
```

---

## TASK 4 — Fix: Rate Limiters Fail-Closed in Production (High H-1)

```
You are working on a Next.js 14 app (App Router) using Upstash Redis for rate limiting.

Fix a High severity security issue where rate limiters silently disable themselves when Redis is not configured.

FILE TO EDIT: lib/rate-limit.ts

WHAT TO DO:
1. In the checkRateLimit function, when limiter is null:
   - If process.env.NODE_ENV === 'production': log a console.error with '[SECURITY] Rate limiter unavailable in production — blocking request' and return true (treat as rate-limited, blocking the request)
   - If not production: log a console.warn that rate limiting is disabled in dev and return false (allow through)
2. Do not change the limiter creation logic
3. Do not change getClientIp

ADDITIONAL — also fix getClientIp in the same file:
Current code takes the FIRST value of x-forwarded-for which is user-controlled. Fix:
- First try x-real-ip header (reliable on Vercel/Cloudflare)
- If not present, take the LAST comma-separated value from x-forwarded-for (not first)
- If neither exists, return 'unknown'

EXPECTED RESULT: In production, a misconfigured Redis means ALL rate-limited endpoints block requests rather than silently allowing unlimited access. In dev, they continue to pass through with a warning.
```

---

## TASK 5 — Fix: AI PUT Prompt Injection via Client-Supplied Project Data (High H-2)

```
You are working on a Next.js 14 app (App Router).

Fix a High severity prompt injection vulnerability in the AI recommendation endpoint.

PROBLEM:
PUT /api/ai/ask accepts a 'projects' array from the request body and injects field values (pros, cons, name, etc.) directly into the AI system prompt via JSON.stringify. A malicious user can craft projects with prompt injection payloads in any string field.

FILE TO EDIT: app/api/ai/ask/route.ts  
RELATED FILE: services/projects.ts (for reference — getProjectsByIds function)

WHAT TO DO in the PUT handler:
1. Extract only project IDs from the client-supplied projects array:
   const projectIds = (projects || []).slice(0, 50)
     .map((p: any) => typeof p?.id === 'string' ? p.id : null)
     .filter((id): id is string => id !== null && /^[0-9a-f-]{36}$/.test(id))

2. Fetch the actual project data from the database using getProjectsByIds(projectIds)

3. Build the projectList for the prompt from the DB-fetched data only — never from the client-supplied projects array

4. If getProjectsByIds returns empty, return 400 { error: 'No valid projects provided' }

5. Keep the .slice(0, 50) safety cap and the existing auth check

EXPECTED RESULT: The AI prompt is always built from trusted database data. Client-supplied field values (which could contain injection payloads) are never injected into the prompt.
```

---

## TASK 6 — Fix: Admin Leads PATCH Status Validation (High H-3)

```
You are working on a Next.js 14 app (App Router) using Zod for validation.

Fix a High severity input validation issue in the admin leads API.

PROBLEM:
PATCH /api/admin/leads?id=... accepts body.status and writes it to the database without any enum validation. Any string can be written as a lead status.

FILE TO EDIT: app/api/admin/leads/route.ts

WHAT TO DO in the PATCH handler:
1. Import z from 'zod' at the top (it may already be imported)
2. Define a Zod schema for the PATCH body:
   const patchSchema = z.object({
     status: z.enum(['new', 'contacted', 'site_visit_scheduled', 'site_visit_done', 'qualified', 'negotiating', 'closed_won', 'closed_lost', 'rejected'])
   })
3. Parse req.json() through patchSchema.safeParse()
4. If parsing fails, return 400 { error: 'Invalid status value' }
5. Use parsed.data.status in the database update, not body.status
6. Do not change the GET handler

EXPECTED RESULT: Only valid, whitelisted status strings can be written to the leads table via this endpoint.
```

---

## TASK 7 — Fix: Admin Login `from` Redirect Open Redirect (High H-4)

```
You are working on a Next.js 14 app (App Router).

Fix a High severity open redirect vulnerability in the admin login page.

PROBLEM:
The admin login page reads ?from= from search params and uses router.replace(from) after successful login without validating that 'from' is a relative path. An attacker can craft /admin/login?from=https://evil.com to redirect admins to external sites after login.

FILE TO EDIT: app/admin/login/page.tsx

WHAT TO DO:
1. In the LoginForm component, where from is read from searchParams:
   const rawFrom = searchParams?.get('from') || '/admin'
   const from = rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/admin'
2. Use this validated 'from' value in router.replace(from)
3. Do not change anything else in the file

EXPECTED RESULT: After admin login, the redirect target is always a relative path within the app. External URLs in ?from= are ignored and fall back to /admin.
```

---

## TASK 8 — Fix: Replace Raw DB Error Messages in Admin Routes (High H-5)

```
You are working on a Next.js 14 app (App Router).

Fix information disclosure in admin API routes by replacing raw Supabase error.message in responses.

PROBLEM:
Multiple admin routes return error.message from Supabase directly in the API response JSON. Supabase errors can contain table names, column names, PostgreSQL constraint names, and other DB internals.

FILES TO EDIT (all of these):
- app/api/admin/leads/route.ts
- app/api/admin/builders/route.ts
- app/api/admin/amenity-library/route.ts
- app/api/admin/amenity-library/[id]/route.ts
- app/api/admin/contact/route.ts
- app/api/admin/users/route.ts
- app/api/admin/builders/[id]/project-update/route.ts

WHAT TO DO in EACH file:
1. Find every instance of:
   return NextResponse.json({ error: error.message }, { status: 500 })
2. Replace with a pattern that:
   a. Logs the real error server-side: console.error('[admin/<route>] DB error:', error)
   b. Returns a generic message: return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
3. Use the specific route name in the console.error prefix for traceability (e.g. '[admin/leads]', '[admin/builders]', etc.)
4. Do not change success responses or non-500 error responses

EXPECTED RESULT: Clients receive only generic error messages. Real error details are logged server-side only.
```

---

## TASK 9 — Fix: Unbounded In-Memory Caches (High H-6)

```
You are working on a Next.js 14 app (App Router).

Fix two unbounded in-memory caches that can cause memory exhaustion.

PROBLEM:
app/api/nearby/route.ts and app/api/ai/embed/route.ts both use Map() caches with no size limit. An attacker flooding these endpoints with varied but valid inputs can exhaust server memory.

FILES TO EDIT:
1. app/api/nearby/route.ts
2. app/api/ai/embed/route.ts

WHAT TO DO in app/api/nearby/route.ts:
1. Add a constant: const MAX_CACHE_SIZE = 200
2. After every cache.set() call, add a size check:
   if (cache.size > MAX_CACHE_SIZE) {
     const now = Date.now()
     // Remove expired entries first
     for (const [key, val] of cache.entries()) {
       if (now >= val.expiresAt) cache.delete(key)
     }
     // If still over limit, remove oldest by expiry
     if (cache.size > MAX_CACHE_SIZE) {
       const oldest = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0]
       if (oldest) cache.delete(oldest[0])
     }
   }

WHAT TO DO in app/api/ai/embed/route.ts:
1. Add a constant: const MAX_EMBEDDING_CACHE_SIZE = 100
2. After embeddingCache.set() call, add:
   if (embeddingCache.size > MAX_EMBEDDING_CACHE_SIZE) {
     const oldest = [...embeddingCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
     if (oldest) embeddingCache.delete(oldest[0])
   }

EXPECTED RESULT: Both caches have a hard upper bound on entries. Memory growth is controlled.
```

---

## TASK 10 — Fix: Admin Session Token Should Be Random, Not Deterministic (Medium M-2)

```
You are working on a Next.js 14 app (App Router) using Upstash Redis.

Fix a Medium severity issue where the admin session cookie value is a static, deterministic SHA-256 hash of the password — it never rotates and cannot be truly invalidated.

FILES TO EDIT:
- lib/admin-auth.ts
- app/api/admin/auth/route.ts (login)
- app/api/admin/logout/route.ts

WHAT TO DO:

In lib/admin-auth.ts:
1. Add a new function generateSessionToken() that returns crypto.randomUUID() + '-' + Date.now().toString(36)
2. Add a new async function storeSessionToken(token: string): stores the token in Upstash Redis with a TTL equal to ADMIN_COOKIE_MAX_AGE seconds. Key: 'admin_session:<token>', Value: '1'. If Redis is unavailable (env vars missing), log a warning and store in a local module-level Set<string> as fallback.
3. Add a new async function verifySessionToken(token: string): checks if the token exists in Redis (or the fallback Set). Returns boolean.
4. Add a new async function deleteSessionToken(token: string): deletes from Redis (or fallback Set).
5. Keep checkAdminPassword() and ADMIN_COOKIE_NAME unchanged — they are still needed for the login check
6. Remove getAdminSessionValue() and update isAdminAuthenticated() to be async: it reads the cookie value and calls verifySessionToken()

In app/api/admin/auth/route.ts (login):
1. After checkAdminPassword() succeeds, call generateSessionToken() to get a new random token
2. Call storeSessionToken(token) to persist it
3. Set the cookie value to this random token (not the hash)

In app/api/admin/logout/route.ts:
1. Read the current admin_session cookie value from the request
2. Call deleteSessionToken(cookieValue) to invalidate it server-side
3. Then clear the cookie as before (maxAge: 0)

In proxy.ts:
1. Update the admin guard to call the now-async verifySessionToken — wrap in await. Since proxy.ts already runs as async, this is fine.
2. Actually: since isAdminAuthenticated is now async, update proxy.ts to await it

IMPORTANT: If Upstash Redis env vars are not set, fall back gracefully to the in-memory Set (for dev). In production, log a security warning if Redis is unavailable.

EXPECTED RESULT: Each login generates a unique, unguessable session token. Logout actually invalidates the token server-side. Old intercepted cookies cannot be reused after logout.
```

---

## TASK 11 — Fix: RLS Policy for `user_intent_embeddings` INSERT (Medium M-4)

```
You are working on a Next.js 14 + Supabase project.

Fix a Medium severity RLS misconfiguration that allows anonymous users to insert into the user_intent_embeddings table.

FILE TO CREATE: supabase/migrations/20260613_fix_embeddings_rls.sql

WHAT TO DO:
Create a new SQL migration file with the following content:

-- Fix: user_intent_embeddings INSERT policy was overly permissive (WITH CHECK (true))
-- This allowed anon role to insert arbitrary embeddings, polluting vector search

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service insert embeddings" ON user_intent_embeddings;

-- New policy: only authenticated users can insert their own embedding row
-- Service role bypasses RLS automatically for server-side inserts
CREATE POLICY "Auth users insert own embeddings"
  ON user_intent_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Keep the public read policy as-is (it's intentional)

Add a comment at the top of the file explaining the security reason for this change.

EXPECTED RESULT: Anonymous users can no longer insert rows into user_intent_embeddings. Only authenticated users can insert their own rows. Server-side service role inserts continue to work.
```

---

## TASK 12 — Fix: R2 File Extension from Validated Content Type (Medium M-5)

```
You are working on a Next.js 14 app (App Router).

Fix a Medium severity issue where uploaded file keys in R2 use the client-supplied filename extension instead of the extension derived from the validated content type.

FILES TO EDIT:
- lib/r2.ts
- app/api/admin/upload/route.ts

WHAT TO DO in lib/r2.ts:
1. Update generateFileKey() to accept an optional second parameter: ext?: string
2. If ext is provided, use it directly (don't derive from originalName)
3. If not provided, fall back to current behavior (derive from filename) — for backward compatibility
4. Keep the sanitization of the name portion

WHAT TO DO in app/api/admin/upload/route.ts:
1. After the magic bytes validation and contentType determination, derive the extension from contentType:
   const MIME_TO_EXT: Record<string, string> = {
     'image/jpeg': 'jpg',
     'image/png': 'png',
     'image/webp': 'webp',
   }
   const safeExt = MIME_TO_EXT[contentType]
   if (!safeExt) {
     return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
   }
2. Pass safeExt to generateFileKey: const key = generateFileKey(file.name, safeExt)
3. This ensures the stored file extension always matches the validated content type

EXPECTED RESULT: R2 object keys always have an extension derived from validated magic bytes, never from the client-supplied filename. Double extensions like .php.jpg are impossible.
```

---

## TASK 13 — Fix: Contact Route Validation Error Details Not Exposed (Medium M-6)

```
You are working on a Next.js 14 app (App Router).

Fix a Medium severity information disclosure in the contact form API.

PROBLEM:
POST /api/contact returns Zod's parsed.error.flatten() in the response body on validation failure, exposing internal field names and schema structure.

FILE TO EDIT: app/api/contact/route.ts

WHAT TO DO:
1. Find the block that returns validation errors:
   return NextResponse.json(
     { error: 'Invalid form data', details: parsed.error.flatten() },
     { status: 400 }
   )
2. Replace with:
   console.warn('[contact] Validation failed:', JSON.stringify(parsed.error.flatten()))
   return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
3. Also check app/api/leads/qualify/route.ts for the same pattern and apply the same fix there if present

EXPECTED RESULT: Clients receive only 'Invalid form data'. Schema details are logged server-side only.
```

---

## TASK 14 — New Feature: Cookie Consent Banner (GDPR/DPDP Compliant)

```
You are working on a Next.js 14 app (App Router) using Tailwind CSS and shadcn/ui components.

Build a fully functional, accessible, GDPR + India DPDP Act compliant cookie consent system.

BRAND TOKENS (use CSS variables throughout — these are already defined in the app's globals.css):
- Background: var(--background) → #0D2B1A (forest ink)
- Surface: var(--surface-raised) → slightly lighter dark green
- Primary: var(--primary) → #22C55E (electric green)
- Text Primary: var(--text-primary) → #FFFFFF
- Text Muted: var(--text-muted) → muted green-grey
- Border: var(--border) → rgba(255,255,255,0.1)
- Radius: var(--radius)
- Font Display: var(--font-display) → Syne
- Font Body: Plus Jakarta Sans (body default)

COOKIE CATEGORIES to implement:

1. ESSENTIAL (always on, cannot be toggled):
   - Session cookies (Supabase auth JWT)
   - Security cookies (admin_session, CSRF)
   - Preference cookies (theme, onboarding state)
   Description: "Required for the site to work. Cannot be disabled."

2. ANALYTICS (opt-in, default OFF):
   - PostHog (NEXT_PUBLIC_POSTHOG_KEY)
   Description: "Helps us understand how visitors use Propcinity. No personally identifiable data is shared."

3. FUNCTIONAL (opt-in, default ON):
   - AI chat cache (in-memory, no PII)
   - Nearby places cache
   Description: "Improves your experience by remembering your preferences and enabling features like AI chat."

---

FILES TO CREATE:

### 1. lib/cookie-consent.ts
A utility module that:
- Defines a TypeScript interface CookieConsent { essential: true, analytics: boolean, functional: boolean, version: string, timestamp: number }
- Exports COOKIE_CONSENT_KEY = 'propcinity_cookie_consent'
- Exports CONSENT_VERSION = '1.0' (bump this when categories change to re-prompt users)
- Exports getConsent(): CookieConsent | null — reads from localStorage, returns null if not set or version mismatch
- Exports setConsent(prefs: Omit<CookieConsent, 'essential' | 'version' | 'timestamp'>): void — saves to localStorage with essential: true, version, and timestamp
- Exports hasConsented(): boolean — returns true if a valid, current-version consent exists
- Exports isAnalyticsAllowed(): boolean — returns getConsent()?.analytics ?? false
- Exports isFunctionalAllowed(): boolean — returns getConsent()?.functional ?? true

### 2. components/consent/CookieBanner.tsx
A 'use client' component that:

BANNER BEHAVIOR:
- Shows a bottom-of-screen banner (fixed position) the FIRST time a user visits (no valid consent stored)
- Does NOT show if the user has already consented (any choice)
- Has a subtle slide-up animation on mount (Tailwind animate or CSS transition)
- Is dismissible ONLY by making an explicit choice (no X button to close without choosing)

BANNER UI (compact bottom bar with expand option):
- Shows the Propcinity logo mark (just "P" in a small green circle, like the admin login)
- Headline: "We use cookies to improve your experience"
- Subtext: "We use essential cookies for security and auth. Analytics and functional cookies help us improve the product. You're in control."
- Three buttons:
  1. "Accept All" — CTA style (primary green bg, white text)
  2. "Essential Only" — ghost style (border, text-muted)
  3. "Manage Preferences" — text link style (underline)
- A "Learn more" link that opens the preferences modal

PREFERENCES MODAL (opens on "Manage Preferences" click):
- Full modal overlay with backdrop blur
- Title: "Cookie Preferences"
- Subtitle: "Control how Propcinity uses cookies on your device. Your choices are saved locally."
- Three cookie category rows, each with:
  - Category name (bold, Syne font)
  - Description (small, muted)
  - A toggle switch (shadcn Switch or custom)
  - "Always On" badge for Essential (non-interactive, green badge)
  - Default state: Analytics OFF, Functional ON
- Footer buttons: "Save Preferences" (primary) and "Cancel" (ghost)
- Close on backdrop click only if user has previously consented (otherwise they must make a choice)

DESIGN REQUIREMENTS:
- Banner sits at bottom of screen, above the mobile BottomNav (z-index 40, BottomNav is likely z-30 — check and set appropriately)
- Use the forest ink dark theme to match the app: dark bg with green accents
- Toggle switches use #22C55E when active
- The banner should feel like it belongs in this app, not like a generic GDPR popup
- Add a small lock icon (lucide-react Lock) next to "Essential" category
- Respect prefers-reduced-motion for the slide-up animation
- Full keyboard accessibility: focus trap in modal, Escape to close modal (but only if previously consented)

### 3. components/consent/CookieConsentProvider.tsx
A 'use client' Context Provider that:
- Creates a CookieConsentContext with value: { consent: CookieConsent | null, updateConsent: (prefs) => void, showBanner: boolean, openPreferences: () => void }
- On mount, reads consent from localStorage via getConsent()
- Exposes openPreferences() so other parts of the app (e.g. footer) can open the modal
- Renders CookieBanner as a child when showBanner is true
- Exports useCookieConsent() hook

### 4. Update: app/layout.tsx (or the root layout file)
- Import and wrap the app with CookieConsentProvider
- Place it inside the existing providers but outside the main content — check the existing layout structure first and insert it correctly without breaking existing providers

### 5. Update: components/layout/Footer.tsx
- Add a "Cookie Preferences" link in the footer (near the privacy policy links if they exist, or in a new legal links row)
- This link calls openPreferences() from useCookieConsent() context
- Style it as a small text link matching other footer links

### 6. Update: PostHog initialization (find where PostHog is initialized client-side)
- Wrap the PostHog capture/identify calls with isAnalyticsAllowed() check
- If analytics is not allowed, skip PostHog initialization entirely
- Check lib/posthog-events.ts and any provider that initializes PostHog

---

IMPLEMENTATION NOTES:
- Use localStorage (not cookies) for storing consent preferences — consent record itself doesn't need to be a cookie
- All localStorage reads must be wrapped in try/catch and guarded with typeof window !== 'undefined'
- The banner must not cause hydration mismatches — use useEffect to show it only client-side
- Do not use any external cookie consent library — build from scratch
- Keep the total bundle addition under 15KB
- Export CookieBanner as default from components/consent/CookieBanner.tsx

EXPECTED RESULT: Users see a branded cookie consent banner on first visit. They can accept all, accept only essential, or granularly manage analytics and functional cookies. Their choice is persisted. PostHog is only initialized if analytics consent is given. A footer link lets users change their preferences anytime.
```

---

## TASK 15 — Fix: CSP Remove unsafe-eval (Medium M-1, tracked improvement)

```
You are working on a Next.js 14 app (App Router).

Remove unsafe-eval from the Content Security Policy in next.config.mjs.

PROBLEM:
The CSP currently includes 'unsafe-eval' in script-src. This allows eval(), new Function(), and similar dynamic code execution, significantly weakening XSS protections. Next.js 14 production builds do not require unsafe-eval.

FILE TO EDIT: next.config.mjs

WHAT TO DO:
1. In the cspDirectives array, find the script-src line:
   "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
2. Remove 'unsafe-eval':
   "script-src 'self' 'unsafe-inline'"
3. Add a TODO comment above it:
   // TODO: Replace 'unsafe-inline' with nonce-based CSP post-launch
   // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
4. Do not change any other CSP directives
5. Test that the app still builds and runs — if any dependency breaks with unsafe-eval removed, note it in a comment but do not re-add it without documenting the specific reason

EXPECTED RESULT: eval() and new Function() are blocked by CSP. This is a meaningful XSS hardening step. unsafe-inline remains temporarily (pending nonce implementation) and is documented as tech debt.
```

---

## TASK 16 — Fix: Health Endpoint and LAN IP in Config (Low L-2, L-4)

```
You are working on a Next.js 14 app (App Router).

Two minor cleanup fixes:

FIX 1 — app/api/health/route.ts:
Replace the health endpoint response to not confirm service liveness to anonymous scanners.
Add a simple token check: if the request has header x-health-check matching process.env.HEALTH_CHECK_TOKEN (if set), return 200 { ok: true, ts: Date.now() }. Otherwise return 200 { ok: true } with no additional details. This is a low-effort improvement — do not add complex auth, just reduce information.

FIX 2 — next.config.mjs:
Replace the hardcoded LAN IP in allowedDevOrigins:
CURRENT: allowedDevOrigins: ['192.168.1.33', 'localhost']
NEW: allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS?.split(',') ?? ['localhost']).map(s => s.trim())

Add ALLOWED_DEV_ORIGINS= to .env.example with a comment:
# Comma-separated origins for Next.js dev server (e.g. localhost,192.168.1.33)
ALLOWED_DEV_ORIGINS=localhost

EXPECTED RESULT: No hardcoded LAN IP in source code. Health endpoint returns minimal information.
```

---

## VERIFICATION CHECKLIST

After completing all tasks, verify the following:

```
[ ] proxy.ts — admin routes redirect to login for ANY invalid/forged cookie value
[ ] POST /api/ai/ask — returns 401 for unauthenticated requests
[ ] PUT /api/admin/settings — returns 400 for unknown setting keys
[ ] lib/rate-limit.ts — returns true (blocks) in production when Redis unavailable
[ ] PUT /api/ai/ask — recommendation prompt uses only DB-fetched project data
[ ] PATCH /api/admin/leads — rejects invalid status strings
[ ] app/admin/login/page.tsx — ?from=https://evil.com redirects to /admin instead
[ ] Admin API routes — no Supabase error.message in response bodies
[ ] /api/nearby — cache has MAX_CACHE_SIZE = 200 eviction
[ ] /api/ai/embed — embeddingCache has MAX_EMBEDDING_CACHE_SIZE = 100 eviction
[ ] Admin session token — random UUID stored in Redis, not sha256(password)
[ ] user_intent_embeddings — anon INSERT blocked by RLS
[ ] R2 uploads — file extension from validated content type, not filename
[ ] /api/contact — Zod details not returned to client
[ ] Cookie banner appears on first visit
[ ] "Essential Only" saves consent and hides banner
[ ] "Accept All" saves consent with analytics: true
[ ] Manage Preferences modal opens, toggles work, Save persists
[ ] Footer has "Cookie Preferences" link that reopens modal
[ ] PostHog only initializes when analytics: true in consent
[ ] CSP no longer contains unsafe-eval
[ ] No hardcoded LAN IP in next.config.mjs
[ ] All TypeScript compiles without errors (run: npx tsc --noEmit)
[ ] No new console.error in browser devtools from security fixes
```

---

## NOTES FOR CURSOR

- This app uses `proxy.ts` NOT `middleware.ts` — never create or modify `middleware.ts`
- All new files should use TypeScript with strict types — no `any` unless explicitly noted
- CSS should use existing CSS variables (`var(--primary)` etc.) — do not hardcode hex colors
- The app uses `@upstash/redis` and `@upstash/ratelimit` — these are already in package.json
- Supabase client: use `createServerSupabaseClient()` for server components/routes, `createClient()` for client components
- Admin auth: `isAdminAuthenticated()` for API routes, proxy for page-level guard
- Run `npx tsc --noEmit` after each task to catch type errors before moving on