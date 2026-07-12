// app/api/debug-ip/route.ts
//
// ⚠️  SECURITY NOTICE — TEMPORARY DEBUG ENDPOINT  ⚠️
// ─────────────────────────────────────────────────────────────────────────────
// This route exposes raw network/header info (real IP, forwarded-for chain).
// It intentionally lives OUTSIDE /admin so it can be reached even when the
// IP allowlist gate is blocking your access to /admin routes.
//
// PURPOSE: Hit GET /api/debug-ip to see exactly what IP the edge resolves for
// your request — then compare that value against ADMIN_ALLOWED_IPS in Vercel.
//
// ⚠️  DELETE THIS FILE (or gate it behind a secret query param) before
//     leaving it live in production long-term. See task #6 in prdv1.md.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

// This mirrors the exact IP resolution logic from proxy.ts → isIpAllowed()
// so you can directly compare the returned `resolvedIp` against what you have
// stored in the ADMIN_ALLOWED_IPS environment variable.
function resolveIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function GET(request: NextRequest) {
  const xRealIp = request.headers.get('x-real-ip')
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xVercelForwardedFor = request.headers.get('x-vercel-forwarded-for')

  // The IP that isIpAllowed() in proxy.ts would resolve and check
  const resolvedIp = resolveIp(request)

  // Snapshot of the current allowlist (read-only, for comparison)
  const allowedRaw = process.env.ADMIN_ALLOWED_IPS ?? null
  const allowedList = allowedRaw
    ? allowedRaw.split(',').map((ip) => ip.trim()).filter(Boolean)
    : []

  const isCurrentlyAllowed =
    process.env.NODE_ENV !== 'production' ||
    !allowedRaw ||
    allowedRaw.trim() === '' ||
    allowedList.includes(resolvedIp)

  return NextResponse.json(
    {
      // ── Raw header values the edge received ────────────────────────────────
      headers: {
        'x-real-ip': xRealIp,
        'x-forwarded-for': xForwardedFor,
        'x-vercel-forwarded-for': xVercelForwardedFor,
      },

      // ── Resolved IP (this is what isIpAllowed() checks against the list) ──
      resolvedIp,

      // ── Allowlist state (read from env at edge runtime) ────────────────────
      allowlist: {
        ADMIN_ALLOWED_IPS_raw: allowedRaw,
        parsed: allowedList,
        isCurrentlyAllowed,
      },

      // ── Guidance ────────────────────────────────────────────────────────────
      instructions: [
        '1. Copy the value of `resolvedIp` above.',
        '2. Go to Vercel → Project → Settings → Environment Variables.',
        '3. Find ADMIN_ALLOWED_IPS. Its current parsed values are in allowlist.parsed.',
        '4. If your resolvedIp is NOT in that list, add it (comma-separated) and redeploy.',
        '5. Delete or secure this endpoint once your access is restored.',
      ],
    },
    { status: 200 },
  )
}

// Force dynamic rendering so headers are always read fresh (never cached)
export const dynamic = 'force-dynamic'
