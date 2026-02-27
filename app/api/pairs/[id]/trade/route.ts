import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { from, type, price, txHash } = await request.json()
    
    if (!from || !type || !price || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
    
    // Update pair statistics
    await prisma.pairedUsername.update({
      where: { id: params.id },
      data: {
        currentPrice: price,
        totalVolume: {
          increment: price,
        },
        highPrice: {
          max: price,
        },
        lowPrice: {
          min: price,
        },
      },
    })
    
    return NextResponse.json({ trade }, { status: 201 })
  } catch (error) {
    console.error('Trade error:', error)
    return NextResponse.json(
      { error: 'Failed to execute trade' },
      { status: 500 }
    )
  }
}