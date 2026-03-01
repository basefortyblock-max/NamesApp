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

    const story = await prisma.story.update({
      where: { id: params.id },
      data: { likes: { increment: 1 } },
    })

    return NextResponse.json({ success: true, likes: story.likes })
  } catch (error: any) {
    console.error('Like error:', error)
    return NextResponse.json({ error: 'Failed to like' }, { status: 500 })
  }
}