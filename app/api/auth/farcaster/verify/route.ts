import { NextRequest, NextResponse } from 'next/server'
import { verifyFarcasterUsername } from '@/lib/oauth/farcaster'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }
    
    const farcasterUser = await verifyFarcasterUsername(username)
    
    if (!farcasterUser) {
      return NextResponse.json(
        { error: 'Farcaster user not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      verified: true,
      user: farcasterUser,
    })
  } catch (error) {
    console.error('Farcaster verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify Farcaster username' },
      { status: 500 }
    )
  }
}