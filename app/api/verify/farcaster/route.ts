import { NextRequest, NextResponse } from 'next/server'
import { verifyFarcasterUsername } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }
    
    const result = await verifyFarcasterUsername(username)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Farcaster verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify Farcaster username' },
      { status: 500 }
    )
  }
}