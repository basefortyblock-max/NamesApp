// app/og-image.png/route.tsx
// OG Image otomatis — tampil saat link dibagikan di Farcaster/Twitter

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '24px',
            background: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: '56px', fontWeight: 700, color: 'white' }}>N</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: 'white',
            margin: '0 0 16px 0',
            letterSpacing: '-2px',
          }}
        >
          Names
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '28px',
            color: '#86efac',
            margin: '0 0 48px 0',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          Philosophy Behind The Username
        </p>

        {/* Badge */}
        <div
          style={{
            background: 'rgba(22, 163, 74, 0.3)',
            border: '1px solid #16a34a',
            borderRadius: '100px',
            padding: '12px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '20px', color: '#4ade80' }}>⚡</span>
          <span style={{ fontSize: '20px', color: '#4ade80', fontWeight: 500 }}>
            Gasless USDC on Base
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}