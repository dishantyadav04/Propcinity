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
          background: '#FF4500',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 18,
          fontFamily: 'serif',
          letterSpacing: '-1px',
        }}
      >
        <span style={{ color: '#FFFFFF', fontWeight: 900 }}>P</span>
      </div>
    ),
    { ...size }
  )
}
