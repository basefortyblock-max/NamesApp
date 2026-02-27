import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { address, author, text } = await request.json()
    
    if (!address || !author || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const comment = await prisma.comment.create({
      data: {
        storyId: params.id,
        address,
        author,
        text,
      },
    })
    
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}