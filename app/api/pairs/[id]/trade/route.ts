import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Route for trading paired usernames
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { from, type, price, txHash } = await request.json()
    
    // Validation
    if (!from || !type || price === undefined || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: from, type, price, txHash' },
        { status: 400 }
      )
    }

    // Validate type - support mint, buy, sell, list
    if (!['mint', 'buy', 'sell', 'list'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "mint", "buy", "sell", or "list"' },
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
        status: 'confirmed',
      },
    })

    // Update pair statistics based on trade type
    const updateData: any = { lastTradeAt: new Date() }

    if (type === 'buy' || type === 'sell') {
      // Update price history for buy/sell trades
      const newHighPrice = Math.max(price, pairedUsername.highPrice || 0)
      const newLowPrice = pairedUsername.lowPrice 
        ? Math.min(price, pairedUsername.lowPrice)
        : price

      updateData.currentPrice = price
      updateData.totalVolume = (pairedUsername.totalVolume || 0) + price
      updateData.highPrice = newHighPrice
      updateData.lowPrice = newLowPrice
    } else if (type === 'list') {
      // For list, set for sale and update price
      updateData.forSale = true
      updateData.currentPrice = price
    } else if (type === 'mint') {
      // For mint, set initial price
      updateData.currentPrice = price
    }

    // Apply updates
    await prisma.pairedUsername.update({
      where: { id: params.id },
      data: updateData,
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
