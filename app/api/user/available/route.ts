import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get users who have published stories
    const stories = await prisma.story.findMany({
      distinct: ['userId'],
      select: {
        userId: true,
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

    // Format response
    const users = stories.map(story => ({
      address: story.user.address,
      username: story.username,
      platform: story.platform,
      verified: story.verified,
      openForPairing: story.user.openForPairing,
      createdAt: story.createdAt,
    }))

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}