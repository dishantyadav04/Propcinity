import { ImageResponse } from 'next/og'

// Next.js ImageResponse defaults to Node; explicitly set to nodejs to avoid
// the deprecated edge runtime warning.
export const runtime = 'nodejs'

export const alt = 'Propcinity — Find the Right Property'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Satori (the renderer behind ImageResponse) can't read next/font's CSS
// variables — it needs raw font bytes. We fetch the exact same families the
// site uses (Syne for display/logo, Plus Jakarta Sans for body) from Google
// Fonts at request time. This is the officially documented pattern for
// next/og. See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
async function loadGoogleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)

  if (match?.[1]) {
    const res = await fetch(match[1])
    if (res.ok) return res.arrayBuffer()
  }
  throw new Error(`Failed to load font: ${family}`)
}

export default async function Image() {
  const headline = 'Propcinity'
  const body =
    "We don't show more properties. We help you choose the right one.Zero Brokerage · AI-Powered · Match % Scoring"

  const [syneBlack, jakartaMedium, jakartaSemibold] = await Promise.all([
    loadGoogleFont('Syne', 800, headline),
    loadGoogleFont('Plus Jakarta Sans', 500, body),
    loadGoogleFont('Plus Jakarta Sans', 600, body),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: '#FAFAF8', // --background
          fontFamily: 'Plus Jakarta Sans',
        }}
      >
        {/* Soft brand-color glow, echoing --primary-glow used across the site */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: 'rgba(255, 69, 0, 0.10)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -220,
            left: -160,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'rgba(255, 69, 0, 0.06)',
          }}
        />

        {/* Logo — exact treatment from TopHeader: "Prop" dark + "cinity" orange */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Syne',
            fontWeight: 800,
            fontSize: 96,
            letterSpacing: '-0.02em',
            marginBottom: 28,
          }}
        >
          <span style={{ color: '#141414' }}>Prop</span>
          <span style={{ color: '#FF4500' }}>cinity</span>
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 500,
            fontSize: 32,
            color: '#525252',
            marginBottom: 6,
          }}
        >
          We don&apos;t show more properties.
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 500,
            fontSize: 32,
            color: '#525252',
            marginBottom: 44,
          }}
        >
          We help you choose the right one.
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 600,
            fontSize: 22,
            color: '#FF4500',
            backgroundColor: '#FFF1EC',
            padding: '14px 28px',
            borderRadius: 100,
          }}
        >
          Zero Brokerage · AI-Powered · Match % Scoring
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Syne', data: syneBlack, weight: 800, style: 'normal' },
        { name: 'Plus Jakarta Sans', data: jakartaMedium, weight: 500, style: 'normal' },
        { name: 'Plus Jakarta Sans', data: jakartaSemibold, weight: 600, style: 'normal' },
      ],
    }
  )
}