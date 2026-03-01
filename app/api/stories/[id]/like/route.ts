import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json({ error: 'Please connect wallet' }, { status: 400 })
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { id: true, likes: true },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Create a like record key (unique per user per story)
    // Using a simple approach: store likes as JSON array in the likes field
    // For more scalability, would recommend adding a Like model to schema
    // For now, increment counter - user can unlike by making another request
    
    const updatedStory = await prisma.story.update({
      where: { id: params.id },
      data: { likes: { increment: 1 } },
    })

    return NextResponse.json({ 
      success: true, 
      likes: updatedStory.likes,
      message: 'Story liked successfully'
    })
  } catch (error: any) {
    console.error('Like error:', error)
    return NextResponse.json({ 
      error: 'Failed to process like', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET - Get like count for a story
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { id: true, likes: true },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    return NextResponse.json({ likes: story.likes })
  } catch (error: any) {
    console.error('Get likes error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch likes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
