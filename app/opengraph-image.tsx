import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Propcinity — Find the Right Property'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
          background: 'linear-gradient(135deg, #0D2B1A 0%, #064e3b 100%)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#22C55E',
            marginBottom: 24,
          }}
        >
          Propcinity
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#a7f3d0',
            opacity: 0.9,
            marginBottom: 8,
          }}
        >
          We don't show more properties.
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#a7f3d0',
            opacity: 0.9,
            marginBottom: 40,
          }}
        >
          We help you choose the right one.
        </div>
        <div
          style={{
            fontSize: 18,
            color: '#6ee7b7',
            opacity: 0.6,
          }}
        >
          Zero Brokerage · AI-Powered · Match % Scoring
        </div>
      </div>
    ),
    { ...size }
  )
}
