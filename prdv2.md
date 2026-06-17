# Cursor Prompt: Configure PostHog Reverse Proxy Detection

## Objective

Fix PostHog Installation Health so that the **Reverse Proxy** check passes while preserving existing analytics functionality.

Current status:

* `$pageview` ✅ Working
* `$pageleave` ✅ Working
* Scroll depth ✅ Working
* Authorized URLs ✅ Working
* Reverse Proxy ❌ Not detected

## Context

Project: Propcinity
Framework: Next.js App Router
PostHog Version: `posthog-js@^1.387.0`

Reverse proxy is already deployed and accessible at:

```ts
https://ingest.propcinity.in
```

However, PostHog Installation Health still does not detect it.

The PostHog SDK must explicitly initialize using:

```ts
posthog.init('<PROJECT_KEY>', {
  api_host: 'https://ingest.propcinity.in',
  ui_host: 'https://us.posthog.com',
})
```

Without setting both `api_host` and `ui_host`, PostHog cannot correctly detect the proxy and some features (toolbar, session replay player) may not work properly.

---

## Scope

Only inspect and modify analytics initialization files.

Primary target:

```text
components/analytics/PostHogProvider.tsx
```

If environment variables are used, verify:

```text
.env.local
.env.production
```

Do NOT refactor unrelated code.

---

## Tasks

### 1. Verify SDK Initialization

Locate:

```ts
posthog.init(...)
```

Ensure:

```ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host:
    process.env.NEXT_PUBLIC_POSTHOG_HOST ??
    'https://ingest.propcinity.in',

  ui_host:
    process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ??
    'https://us.posthog.com',
})
```

---

### 2. Verify Environment Variables

Ensure these variables exist:

```env
NEXT_PUBLIC_POSTHOG_KEY=YOUR_PROJECT_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://ingest.propcinity.in
NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com
```

Verify they are exposed to the browser (`NEXT_PUBLIC_` prefix).

---

### 3. Verify Requests Use Proxy

Open DevTools → Network.

Filter:

```text
ingest.propcinity.in
```

Confirm analytics requests go to:

```text
https://ingest.propcinity.in/e/
```

NOT:

```text
https://us.i.posthog.com/e/
```

If requests still hit `us.i.posthog.com`, identify why the SDK is ignoring the proxy.

---

### 4. Validate Reverse Proxy Headers

Verify the reverse proxy correctly forwards:

```text
/e/
/decide/
/assets/
```

Ensure responses return:

```text
200
```

or

```text
202
```

No redirects or CSP errors should occur.

---

## Deliverables

Provide:

1. Current SDK configuration
2. Required code changes
3. Environment variable changes
4. Network verification results
5. Root cause if proxy detection still fails

---

## To-Do Checklist

* [ ] Confirm `api_host` uses `https://ingest.propcinity.in`
* [ ] Confirm `ui_host` uses `https://us.posthog.com`
* [ ] Verify requests hit `ingest.propcinity.in/e/`
* [ ] Verify `/decide/` works through proxy
* [ ] Verify `/assets/` works through proxy
* [ ] Confirm no requests go directly to `us.i.posthog.com`
* [ ] Wait 5–15 minutes and refresh Installation Health
* [ ] Confirm Reverse Proxy check changes to Passed

## Important Rules

* Do not change analytics behavior.
* Do not modify `$pageview` logic.
* Do not refactor unrelated code.
* Show the diff before applying changes.
* Wait for approval before modifying files.