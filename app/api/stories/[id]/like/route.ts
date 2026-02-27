import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }
    
    // Toggle like
    const story = await prisma.story.findUnique({
      where: { id: params.id },
    })
    
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    // Update likes count
    const updatedStory = await prisma.story.update({
      where: { id: params.id },
      data: {
        likes: {
          increment: 1,
        },
      },
    })
    
    return NextResponse.json({ story: updatedStory })
  } catch (error) {
    console.error('Like story error:', error)
    return NextResponse.json(
      { error: 'Failed to like story' },
      { status: 500 }
    )
  }
}