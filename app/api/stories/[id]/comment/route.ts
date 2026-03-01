import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get comments for a story
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: { storyId: params.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.comment.count({
      where: { storyId: params.id },
    })

    return NextResponse.json({
      comments,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    })
  } catch (error: any) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch comments',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// POST - Add a comment to a story
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { address, author, text } = await request.json()
    
    // Validation
    if (!address || !author || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: address, author, text' },
        { status: 400 }
      )
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      )
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be less than 500 characters' },
        { status: 400 }
      )
    }

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    const comment = await prisma.comment.create({
      data: {
        storyId: params.id,
        address,
        author,
        text: text.trim(),
      },
    })
    
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      {
        error: 'Failed to add comment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
