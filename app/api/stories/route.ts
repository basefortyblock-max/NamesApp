import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, username, platform, story, verified } = await request.json()
    
    console.log('📝 Creating story:', { userId, username, platform, storyLength: story?.length })
    
    if (!userId || !username || !platform || !story) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({ where: { address: userId } })
    if (!user) {
      console.log('👤 Creating user:', userId)
      user = await prisma.user.create({
        data: { address: userId }
      })
    }

    const wordCount = story.trim().split(/\s+/).length
    if (wordCount > 490) {
      return NextResponse.json({ error: `Too long: ${wordCount}/490 words` }, { status: 400 })
    }

    const existingStory = await prisma.story.findFirst({
      where: { username, platform }
    })

    if (existingStory) {
      return NextResponse.json({ error: 'Story already exists' }, { status: 400 })
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

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json({ stories })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}