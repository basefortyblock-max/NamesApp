import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all stories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform')
    const limit = Number.parseInt(searchParams.get('limit') || '50')
    
    const where = platform ? { platform } : {}
    
    const stories = await prisma.story.findMany({
      where,
      include: {
        user: {
          select: {
            address: true,
            basename: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        values: {
          select: {
            amount: true,
          },
        },
        _count: {
          select: {
            comments: true,
            values: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
    
    // Calculate total value for each story
    const storiesWithValue = stories.map(story => ({
      ...story,
      totalValue: story.values.reduce((sum, v) => sum + v.amount, 0),
    }))
    
    return NextResponse.json({ stories: storiesWithValue })
  } catch (error) {
    console.error('Get stories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}

// POST new story
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, username, platform, story, verified, platformLogo } = body
    
    // Validate required fields
    if (!address || !username || !platform || !story) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check word count (max 490 words)
    const wordCount = story.trim().split(/\s+/).length
    if (wordCount > 490) {
      return NextResponse.json(
        { error: 'Story exceeds 490 words limit' },
        { status: 400 }
      )
    }
    
    // Ensure user exists
    await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    })
    
    // Create story
    const newStory = await prisma.story.create({
      data: {
        userId: address,
        username,
        platform,
        story,
        verified: verified || false,
        platformLogo,
      },
      include: {
        user: {
          select: {
            address: true,
            basename: true,
          },
        },
      },
    })
    
    return NextResponse.json({ story: newStory }, { status: 201 })
  } catch (error) {
    console.error('Create story error:', error)
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    )
  }
}