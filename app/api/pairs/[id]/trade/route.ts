import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PENTING: Pastikan tidak ada edge runtime
// export const runtime = 'nodejs' // Optional, default sudah nodejs

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { from, type, price, txHash } = await request.json()
    
    // Validation
    if (!from || !type || !price || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: from, type, price, txHash' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "buy" or "sell"' },
        { status: 400 }
      )
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if paired username exists
    const pairedUsername = await prisma.pairedUsername.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        currentPrice: true,
        highPrice: true,
        lowPrice: true,
        totalVolume: true,
      },
    })

    if (!pairedUsername) {
      return NextResponse.json(
        { error: 'Paired username not found' },
        { status: 404 }
      )
    }

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        pairedUsernameId: params.id,
        from,
        type,
        price,
        txHash,
        status: 'completed',
      },
    })

    // Calculate new high/low prices
    const newHighPrice = Math.max(price, pairedUsername.highPrice || 0)
    const newLowPrice = pairedUsername.lowPrice 
      ? Math.min(price, pairedUsername.lowPrice)
      : price

    // Update pair statistics
    await prisma.pairedUsername.update({
      where: { id: params.id },
      data: {
        currentPrice: price,
        totalVolume: (pairedUsername.totalVolume || 0) + price,
        highPrice: newHighPrice,
        lowPrice: newLowPrice,
        lastTradeAt: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true,
      trade 
    }, { status: 201 })

  } catch (error: any) {
    console.error('Trade error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to execute trade',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Get trade history for a paired username
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trades = await prisma.trade.findMany({
      where: {
        pairedUsernameId: params.id,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 trades
    })

    return NextResponse.json({ trades })

  } catch (error: any) {
    console.error('Get trades error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}