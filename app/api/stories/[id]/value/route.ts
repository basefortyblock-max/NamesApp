import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USDC_DECIMALS = 6
const MIN_AMOUNT = 0.7

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { from, amount, to, txHash } = await request.json()
    
    // Validation
    if (!from || amount === undefined || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: from, amount, to' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount < MIN_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum ${MIN_AMOUNT} USDC required` },
        { status: 400 }
      )
    }

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id },
      select: { id: true, price: true, userId: true, username: true },
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Verify the 'to' address matches the story creator
    const storyOwner = await prisma.user.findUnique({
      where: { id: story.userId },
      select: { address: true },
    })

    if (!storyOwner || storyOwner.address.toLowerCase() !== to.toLowerCase()) {
      return NextResponse.json(
        { error: 'Recipient address mismatch' },
        { status: 400 }
      )
    }

    // Create value record
    // txHash will be provided after the transaction completes on frontend
    const value = await prisma.storyValue.create({
      data: {
        storyId: id,
        from,
        amount,
        txHash: txHash || `pending-${Date.now()}`, // Temporary placeholder
      },
    })

    // Increase story price based on value received
    const priceIncrease = amount * 0.05 // 5% of the appreciation increases story value
    await prisma.story.update({
      where: { id },
      data: { price: { increment: priceIncrease } },
    })

    return NextResponse.json({ 
      success: true, 
      value,
      message: `Sent ${amount} USDC to @${story.username}`,
      newPrice: story.price + priceIncrease,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Send value error:', error)
    
    // Handle specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Transaction already recorded' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to process appreciation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Get value transfers for a story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id },
      select: { id: true, price: true },
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
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
