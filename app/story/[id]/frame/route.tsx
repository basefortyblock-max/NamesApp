import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Fetch story data
  const story = await fetchStory(params.id)
  
  // Return Frame metadata
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#1a6b3c',
          color: 'white',
          padding: '40px',
        }}
      >
        <h1 style={{ fontSize: 48, marginBottom: 20 }}>
          @{story.username}
        </h1>
        <p style={{ fontSize: 24, textAlign: 'center', maxWidth: '80%' }}>
          {story.story.substring(0, 150)}...
        </p>
        <div style={{ marginTop: 30, fontSize: 20 }}>
          💰 {story.price} USDC
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}