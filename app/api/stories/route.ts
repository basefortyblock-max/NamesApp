import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, username, platform, story, verified } = await request.json()
    
    console.log('📝 Creating story:', { userId, username, platform, storyLength: story?.length })
    
    if (!userId || !username || !platform || !story) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let user = await prisma.user.findUnique({ where: { address: userId } })
    if (!user) {
      console.log('👤 Creating user:', userId)
      user = await prisma.user.create({ data: { address: userId } })
    }

    const wordCount = story.trim().split(/\s+/).length
    if (wordCount > 490) {
      return NextResponse.json({ error: `Too long: ${wordCount}/490 words` }, { status: 400 })
    }

    // Check if THIS user already published THIS username
    // Other users CAN publish the same username
    const existingStory = await prisma.story.findFirst({
      where: { 
        userId: user.id,
        username,
      }
    })

    if (existingStory) {
      return NextResponse.json({ error: 'You already published a story for this username' }, { status: 400 })
    }

    const newStory = await prisma.story.create({
      data: {
        userId: user.id,
        username,
        platform,
        story,
        verified: verified || false,
        price: 0.7,
      },
    })

    console.log('✅ Story created:', newStory.id)
    return NextResponse.json({ success: true, story: newStory }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Story error:', error)
    return NextResponse.json({ 
      error: 'Failed to publish', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Fetching all stories...')
    
    const storiesRaw = await prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { address: true },
        },
      },
    })

    const stories = storiesRaw.map((story) => ({
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
      creatorAddress: story.user?.address ?? null,
    }))

    console.log(`✅ Found ${stories.length} stories`)
    
    return NextResponse.json({ 
      success: true,
      count: stories.length,
      stories 
    })
    
  } catch (error: any) {
    console.error('❌ Get stories error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stories',
      details: error.message 
    }, { status: 500 })
  }
}