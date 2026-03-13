// app/api/stories/[id]/value/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MIN_AMOUNT = 0.7

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { from, amount, to, txHash } = await request.json()

    if (!from || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: from, amount' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount < MIN_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum ${MIN_AMOUNT} USDC required` },
        { status: 400 }
      )
    }

    // ✅ txHash is now required — this route is only called after onchain confirmation
    if (!txHash) {
      return NextResponse.json(
        { error: 'txHash is required — must be called after onchain confirmation' },
        { status: 400 }
      )
    }

    const story = await prisma.story.findUnique({
      where: { id },
      select: { id: true, price: true, userId: true, username: true },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // ✅ Save real txHash from onchain — no more pending placeholder
    const value = await prisma.storyValue.create({
      data: {
        storyId: id,
        from,
        amount,
        txHash,
      },
    })

    const priceIncrease = amount * 0.05
    await prisma.story.update({
      where: { id },
      data: { price: { increment: priceIncrease } },
    })

    return NextResponse.json(
      {
        success: true,
        value,
        message: `Sent ${amount} USDC to @${story.username}`,
        newPrice: story.price + priceIncrease,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Send value error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Transaction already recorded' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to process appreciation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const story = await prisma.story.findUnique({
      where: { id },
      select: { id: true, price: true },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const values = await prisma.storyValue.findMany({
      where: { storyId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.storyValue.aggregate({
      where: { storyId: id },
      _sum: { amount: true },
      _count: true,
    })

    return NextResponse.json({
      values,
      totalAmount: total._sum.amount || 0,
      totalCount: total._count,
      storyCurrentPrice: story.price,
      limit,
      offset,
      hasMore: offset + limit < (total._count || 0),
    })
  } catch (error: any) {
    console.error('Get values error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch appreciation history',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}