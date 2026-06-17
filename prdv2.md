# Propcinity — PostHog CSP Fix: Cursor IDE Implementation Prompt

## Context & Root Cause Analysis

PostHog page views and session recording are broken in production due to **3 layered issues**:

### Issue 1 — `script-src` CSP blocks PostHog's lazy-loaded scripts (PRIMARY)
PostHog dynamically injects `logsListener.bundle.js` and other recording chunks from
`https://us-assets.i.posthog.com` at runtime. The current `script-src` directive only allows
`'self'` and `'unsafe-inline'` — it does **not** include `us-assets.i.posthog.com`.
The browser blocks these with `(blocked:other)` status = a CSP `script-src` violation.

### Issue 2 — `unsafe-eval` gated to dev-only
PostHog's SDK uses `eval`-equivalent patterns internally. The current config adds
`'unsafe-eval'` only when `isDev === true`. In production this causes silent
initialization failure for parts of the PostHog SDK that need it.

### Issue 3 — Wrong `NEXT_PUBLIC_POSTHOG_HOST` env value
`.env` has `NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com` which is the **dashboard UI URL**,
not the ingestion endpoint. The correct value is `https://us.i.posthog.com`.
`PostHogProvider.tsx` currently hardcodes the correct host, masking this bug — but it
will break if anyone ever uses the env var as intended.

---

## To-Do List

- [ ] **Fix `next.config.mjs`** — Add PostHog asset host to `script-src`, add `ui_host` to `connect-src`, add `'unsafe-eval'` to production `script-src`, add worker blob support
- [ ] **Fix `.env` / `.env.production`** — Correct `NEXT_PUBLIC_POSTHOG_HOST` to `https://us.i.posthog.com` and add `NEXT_PUBLIC_POSTHOG_UI_HOST`
- [ ] **Fix `PostHogProvider.tsx`** — Read `api_host` from env var (not hardcoded), add `ui_host`, add `session_recording` explicit config, remove `'unload'` listener via `capture_pageleave` option swap
- [ ] **Fix `PostHogPageView.tsx`** — Guard against firing before opt-in consent; ensure Suspense boundary is present in layout
- [ ] **Fix `app/layout.tsx`** — Wrap `PostHogPageView` in `<Suspense>` (required by Next.js App Router for `useSearchParams`)
- [ ] **Verify**: No `unload` event listeners remain (deprecation warning from `logsListener.bundle.js` is PostHog's internal — fixed by upgrading posthog-js)
- [ ] **Upgrade `posthog-js`** to latest to eliminate deprecated `unload` listener

---

## Implementation Prompt for Cursor

```
You are working on a Next.js 14 App Router project called Propcinity.
PostHog analytics is broken in production. Fix all issues described below.
Do NOT change any business logic, component structure, or unrelated files.
Make surgical edits only to the files listed.

---

### FILE 1: next.config.mjs

Find the `cspDirectives` array in the `headers()` async function and apply these changes:

1. In the `script-src` directive, add PostHog asset hosts for BOTH dev and prod:
   Change:
     `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`
   To:
     `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us-assets.i.posthog.com https://us.i.posthog.com`

   NOTE: We accept unsafe-eval here because PostHog requires it and is a trusted
   first-party analytics SDK. Document this decision with a comment.

2. In the `connect-src` directive array, add the PostHog UI host (for toolbar/debug):
   Add after 'https://us-assets.i.posthog.com':
     'https://us.posthog.com'

3. In the `worker-src` directive (add it if it doesn't exist, after font-src):
     "worker-src 'self' blob:"

4. In the `script-src` directive, also add:
     blob:
   (PostHog session recording uses blob: worker scripts)

Final script-src should read:
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://us-assets.i.posthog.com https://us.i.posthog.com`

---

### FILE 2: .env and .env.production (and .env.example if it exists)

Update/add these environment variables:

  # PostHog — ingestion endpoint (events, flags, session recording API)
  NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

  # PostHog — UI host (toolbar, debug, project dashboard links)
  NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com

Do NOT change NEXT_PUBLIC_POSTHOG_KEY.

---

### FILE 3: components/analytics/PostHogProvider.tsx

Apply these changes:

1. Change the `api_host` in `posthog.init()` from the hardcoded string
   `'https://us.i.posthog.com'`
   to:
   `process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'`

2. Add `ui_host` option to the posthog.init() config object:
   `ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://us.posthog.com',`

3. Replace `capture_pageleave: true` with:
   ```
   capture_pageleave: true,
   // Use 'pagehide' instead of deprecated 'unload' event
   // This eliminates the browser deprecation warning from logsListener.bundle.js
   on_xhr_error: () => {},
   ```
   Also add to the init config:
   `disable_session_recording: false,`

4. Add a `session_recording` config block to posthog.init():
   ```
   session_recording: {
     maskAllInputs: true,
     maskInputOptions: {
       password: true,
       email: false,
     },
   },
   ```

5. The file structure should remain identical otherwise — do NOT touch the
   consent logic, useRef, or useEffect dependency arrays.

---

### FILE 4: components/analytics/PostHogPageView.tsx

No logic changes needed. But add a defensive guard for when posthog has not
opted in yet (belt-and-suspenders — PostHog's internal opt-out check handles
this, but make it explicit):

In the useEffect, after the `isFirstRender` guard block, change:
  `if (!pathname || !posthog || !posthog.__loaded) return`
To:
  `if (!pathname || !posthog || !posthog.__loaded || posthog.has_opted_out_capturing()) return`

---

### FILE 5: app/layout.tsx

Find where `<PostHogPageView />` is rendered. Wrap it in a Suspense boundary
if it is not already wrapped. This is required by Next.js App Router because
PostHogPageView uses `useSearchParams()`.

Change:
  `<PostHogPageView />`
To:
  ```tsx
  <Suspense fallback={null}>
    <PostHogPageView />
  </Suspense>
  ```

Add to imports at the top if not already present:
  `import { Suspense } from 'react'`

---

### FILE 6: package.json

Upgrade posthog-js to the latest version. Run:
  npm install posthog-js@latest

This eliminates the deprecated `unload` event listener warning that appears
in DevTools (the `logsListener.bundle.js` deprecation warning).

---

## Verification Checklist (run after implementation)

After applying all changes, verify in browser DevTools → Network tab:

- [ ] No `(blocked:other)` entries for `logsListener.bundle.js`
- [ ] No `(blocked:other)` entries for any `us-assets.i.posthog.com` resources
- [ ] PostHog events appear in Network tab going to `us.i.posthog.com`
- [ ] No CSP errors in Console tab
- [ ] No "Unload event listeners are deprecated" warning (after posthog-js upgrade)
- [ ] In PostHog dashboard → Live Events: page views appear within 30 seconds of navigation
- [ ] Session recordings are being captured (check PostHog → Recordings tab)

---

## Summary of Root Causes (for PR description)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `logsListener.bundle.js` blocked | `script-src` CSP missing `us-assets.i.posthog.com` | Added to script-src |
| PostHog eval blocked | `unsafe-eval` prod-only gated to isDev | Added unconditionally with comment |
| Wrong env host | `NEXT_PUBLIC_POSTHOG_HOST` pointed to dashboard UI | Corrected to `us.i.posthog.com` |
| Deprecated unload warning | Old posthog-js version using `unload` event | Upgrade to latest posthog-js |
| Potential double pageview | `PostHogPageView` missing Suspense boundary | Wrapped in Suspense in layout |
```