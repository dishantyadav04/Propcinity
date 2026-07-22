import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/debug-ip?key=<DEBUG_IP_SECRET>
 *
 * Returns the IP address that the edge resolves for this request, along with
 * the raw incoming headers. Useful for network diagnostics.
 *
 * Security: requires a shared secret (DEBUG_IP_SECRET env var) passed as
 * ?key=... . Requests without the correct key get a plain 404, so the
 * route's existence isn't revealed to unauthenticated callers.
 *
 * Note: Admin routes no longer use an IP allowlist. Admin access is protected
 * by password + 2FA (TOTP) only.
 */
export async function GET(request: NextRequest) {
  const providedKey = request.nextUrl.searchParams.get('key')
  const expectedKey = process.env.DEBUG_IP_SECRET

  if (!expectedKey || providedKey !== expectedKey) {
    return new NextResponse('Not found', { status: 404 })
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const xRealIp = request.headers.get('x-real-ip')
  const xForwardedFor = request.headers.get('x-forwarded-for')

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
  })
}