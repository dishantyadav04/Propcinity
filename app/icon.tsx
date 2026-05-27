import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#FFFFFF',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 16,
          fontFamily: 'sans-serif',
          letterSpacing: '-1px',
          border: '1.5px solid #E5E5E5',
        }}
      >
        <span style={{ color: '#FF4500' }}>P</span>
        <span style={{ color: '#0D0D0D' }}>C</span>
      </div>
    ),
    { ...size }
  )
}
