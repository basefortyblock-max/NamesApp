import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }
    
    const verifications = await prisma.socialVerification.findMany({
      where: { userId: address },
      select: {
        platform: true,
        username: true,
        verified: true,
      },
    })
    
    return NextResponse.json({ accounts: verifications })
  } catch (error) {
    console.error('Get accounts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}