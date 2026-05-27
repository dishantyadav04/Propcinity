import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#FFFFFF',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 88,
          fontFamily: 'sans-serif',
          letterSpacing: '-4px',
          border: '6px solid #E5E5E5',
        }}
      >
        <span style={{ color: '#FF4500' }}>P</span>
        <span style={{ color: '#0D0D0D' }}>C</span>
      </div>
    ),
    { ...size }
  )
}
