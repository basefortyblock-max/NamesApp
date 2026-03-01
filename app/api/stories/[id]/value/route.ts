import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USDC_DECIMALS = 6
const MIN_AMOUNT = 0.7

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { from, amount, txHash } = await request.json()
    
    // Validation
    if (!from || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: from, amount' },
        { status: 400 }
      )
    }

    if (!txHash) {
      return NextResponse.json(
        { error: 'txHash required for USDC transfer verification' },
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
      where: { id: params.id },
      select: { id: true, price: true, userId: true },
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // TODO: Verify txHash on blockchain (Base network)
    // In production, verify USDC transfer actually occurred using:
    // - etherscan API / Alchemy API
    // - Check tx receipt: from (sender), to (contract/recipient), value (amount)
    // For now, create record with "pending" status
    
    const value = await prisma.storyValue.create({
      data: {
        storyId: params.id,
        from,
        amount,
        txHash,
      },
    })

    // Increase story price slightly based on value received
    const priceIncrease = amount * 0.05 // 5% of the value increases story price
    await prisma.story.update({
      where: { id: params.id },
      data: { price: { increment: priceIncrease } },
    })

    return NextResponse.json({ 
      success: true, 
      value,
      message: `Sent ${amount} USDC to @${story.id}`,
      priceIncrement: priceIncrease,
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
        error: 'Failed to send value',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Get value transfers for a story
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { id: true, price: true },
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    const values = await prisma.storyValue.findMany({
      where: { storyId: params.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.storyValue.aggregate({
      where: { storyId: params.id },
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
        error: 'Failed to fetch value transfers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
