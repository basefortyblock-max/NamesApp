import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        stories: {
          select: {
            id: true,
            username: true,
            platform: true,
            verified: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json({ 
      stories: user?.stories || [] 
    })
  } catch (error: any) {
    console.error('Get user stories error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}