// app/api/stories/[id]/route.ts
//
// GET single story by id — fixes 404 when clicking "Read" from Explore page.
// app/story/[id]/page.tsx calls this endpoint to fetch story data.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        user: { select: { address: true } },
      },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    return NextResponse.json({
      story: {
        id: story.id,
        userId: story.userId,
        username: story.username,
        platform: story.platform,
        story: story.story,
        price: story.price,
        likes: story.likes,
        shares: story.shares,
        verified: story.verified,
        createdAt: story.createdAt,
        address: story.address || story.user?.address || '',
      },
    })
  } catch (error: any) {
    console.error('Get story error:', error)
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 })
  }
}