import { NextRequest, NextResponse } from 'next/server'
import { verifyZoraProfile } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json()
    
    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      )
    }
    
    const result = await verifyZoraProfile(identifier)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Zora verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify Zora profile' },
      { status: 500 }
    )
  }
}