import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, username, platform, story, verified } = await request.json()
    
    if (!userId || !username || !platform || !story) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const wordCount = story.trim().split(/\s+/).length
    if (wordCount > 490) {
      return NextResponse.json({ error: `Too long. Max 490 words, you have ${wordCount}` }, { status: 400 })
    }
    if (wordCount < 10) {
      return NextResponse.json({ error: 'Too short. Min 10 words' }, { status: 400 })
    }

    const existingStory = await prisma.story.findFirst({
      where: { username, platform },
    })

    if (existingStory) {
      return NextResponse.json({ error: 'Story already exists for this username' }, { status: 400 })
    }

    const newStory = await prisma.story.create({
      data: {
        userId,
        username,
        platform,
        story,
        verified: verified || false,
        likes: 0,
        shares: 0,
        price: 0.7,
      },
    })

    return NextResponse.json({ success: true, story: newStory }, { status: 201 })

  } catch (error: any) {
    console.error('Create story error:', error)
    return NextResponse.json({ 
      error: 'Failed to publish', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const stories = await prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ stories })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}