import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { from, amount, txHash } = await request.json()
    
    if (!from || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (amount < 0.7) {
      return NextResponse.json({ error: 'Minimum 0.7 USDC' }, { status: 400 })
    }

    // TODO: Verify txHash on blockchain
    
    const value = await prisma.storyValue.create({
      data: {
        storyId: params.id,
        from,
        amount,
        txHash: txHash || `0x${Math.random().toString(16).slice(2)}`,
      },
    })

    // Increase story price slightly
    await prisma.story.update({
      where: { id: params.id },
      data: { price: { increment: amount * 0.1 } },
    })

    return NextResponse.json({ success: true, value })
  } catch (error: any) {
    console.error('Send value error:', error)
    return NextResponse.json({ 
      error: 'Failed to send value',
      details: error.message 
    }, { status: 500 })
  }
}