# Propcinity

Real estate decision intelligence platform for Pune. We don't show more properties — we help you choose the right one.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Supabase (Postgres + RLS + pgvector)
- **Auth:** Supabase Auth (users) + custom HMAC+TOTP (admin)
- **AI:** OpenAI (embeddings + chat)
- **Storage:** Cloudflare R2
- **Email:** Resend
- **Analytics:** PostHog
- **Error tracking:** Sentry
- **Rate limiting:** Upstash Redis
- **Deployment:** Vercel

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in all values.

```bash
cp .env.example .env.local
```

### 3. Run the dev server

```bash
npm run dev
```

### 4. Type check

```bash
npm run typecheck
```

## Key conventions

- Middleware lives in `proxy.ts` (not `middleware.ts`) — Next.js 16 Turbopack convention.
- Admin auth is custom (password + TOTP), separate from Supabase Auth.
- All schema changes go in `supabase/migrations/` — never edit `docs/schema-reference.sql` directly.
- Mock data is opt-in via `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`.

## Project structure

```
app/           → Next.js App Router pages and API routes
components/    → UI components (organized by domain)
lib/           → Utility functions, clients, auth helpers
services/      → Data access layer (Supabase queries)
hooks/         → React hooks
types/         → TypeScript type definitions
supabase/      → Database migrations
docs/          → Reference docs (schema, etc.)
```

## Admin access & IP allowlist

Admin routes (`/admin/*`) are gated by two layers:

1. **IP allowlist** (`ADMIN_ALLOWED_IPS`) — hard 403 if your IP isn't listed.  
2. **Admin session** (password + TOTP + HMAC cookie) — redirects to `/admin/login` if not authenticated.

### ⚠️ Important gotchas

| Gotcha | Detail |
|---|---|
| **Fail-open** | If `ADMIN_ALLOWED_IPS` is empty/unset, ALL IPs are allowed through. Set a real value in Production. |
| **Redeploy required** | Editing `ADMIN_ALLOWED_IPS` in the Vercel dashboard does **not** take effect until a full redeploy. |
| **IP drift** | Your ISP or VPN may assign you a new IP; always re-check if you suddenly get 403s. |

### Diagnosing a 403 lockout

```
GET https://<prod-domain>/api/debug-ip
```

Returns `resolvedIp` — the exact IP the edge middleware sees for your request.  
Compare it to `ADMIN_ALLOWED_IPS` in the Vercel Production environment, add it if missing, then **redeploy**.

Alternatively, clear `ADMIN_ALLOWED_IPS` entirely — password + TOTP still protect the admin login.

