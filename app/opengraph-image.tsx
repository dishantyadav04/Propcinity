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
          background: 'linear-gradient(135deg, #FF4500 0%, #cc3700 100%)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            color: '#FFFFFF',
            marginBottom: 24,
            letterSpacing: '-0.02em',
          }}
        >
          Propcinity
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#FFF1EC',
            opacity: 0.9,
            marginBottom: 8,
          }}
        >
          We don't show more properties.
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#FFF1EC',
            opacity: 0.9,
            marginBottom: 48,
          }}
        >
          We help you choose the right one.
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#FFFFFF',
            opacity: 0.8,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '12px 24px',
            borderRadius: 100,
          }}
        >
          Zero Brokerage · AI-Powered · Match % Scoring
        </div>
      </div>
    ),
    { ...size }
  )
}
