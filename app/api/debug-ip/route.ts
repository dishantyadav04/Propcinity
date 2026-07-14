import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/debug-ip
 *
 * Returns the IP address that the edge resolves for this request, along with
 * the raw incoming headers used by isIpAllowed() in proxy.ts.
 *
 * Use this to diagnose ADMIN_ALLOWED_IPS allowlist mismatches:
 *   1. Hit this endpoint from the browser/device you're trying to admin from.
 *   2. Copy the `resolvedIp` value from the response.
 *   3. Compare it to the ADMIN_ALLOWED_IPS env var in your Vercel dashboard
 *      (Production environment — edits require a full redeploy to take effect).
 *
 * This route is intentionally NOT behind the admin IP gate — the gate in
 * proxy.ts only applies to pathname.startsWith('/admin'), so /api/debug-ip
 * is always reachable, even when you're locked out of /admin.
 *
 * Security note: this route reveals the caller's own IP back to themselves.
 * It does NOT expose the ADMIN_ALLOWED_IPS list or any other secret.
 * You can safely leave it deployed; remove or gate it behind the IP allowlist
 * once the lockout is resolved if you prefer it not to be publicly reachable.
 */
export async function GET(request: NextRequest) {
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const xRealIp = request.headers.get('x-real-ip')
  const xForwardedFor = request.headers.get('x-forwarded-for')

  // Mirror exactly the resolution order used by isIpAllowed() in proxy.ts
  const resolvedIp =
    cfConnectingIp ||
    xRealIp ||
    xForwardedFor?.split(',')[0]?.trim() ||
    'unknown'

  return NextResponse.json({
    resolvedIp,
    headers: {
      'cf-connecting-ip': cfConnectingIp,
      'x-real-ip': xRealIp,
      'x-forwarded-for': xForwardedFor,
    },
    note:
      'resolvedIp mirrors the IP used by the admin allowlist gate in proxy.ts. ' +
      'Add this value to ADMIN_ALLOWED_IPS in your Vercel Production env vars, ' +
      'then trigger a full redeploy.',
  })
}
