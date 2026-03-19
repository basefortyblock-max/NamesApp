// app/api/users/available/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currentAddress = searchParams.get('currentAddress') // ✅ now optional

    // Get all users who have published stories
    // If currentAddress provided, exclude them
    const stories = await prisma.story.findMany({
      distinct: ['userId'],
      where: currentAddress
        ? { user: { address: { not: currentAddress } } }
        : undefined,
      select: {
        username: true,
        platform: true,
        verified: true,
        createdAt: true,
        user: {
          select: {
            address: true,
            openForPairing: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // ✅ Return flat format matching what pair/page.tsx expects
    const users = stories.map(s => ({
      address: s.user.address,
      username: s.username,
      platform: s.platform,
      verified: s.verified,
      openForPairing: s.user.openForPairing,
      createdAt: s.createdAt,
    }))

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Get available users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available users' },
      { status: 500 }
    )
  }
}