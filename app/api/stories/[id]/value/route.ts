import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { from, amount, txHash } = await request.json()
    
    if (!from || !amount || amount < 0.7) {
      return NextResponse.json(
        { error: 'Invalid value amount (minimum 0.7 USDC)' },
        { status: 400 }
      )
    }
    
    // Create value record
    const value = await prisma.storyValue.create({
      data: {
        storyId: params.id,
        from,
        amount,
        txHash,
        status: txHash ? 'completed' : 'pending',
      },
    })
    
    // Update story price
    await prisma.story.update({
      where: { id: params.id },
      data: {
        price: {
          increment: amount,
        },
      },
    })
    
    // Update sender's balance (deduct)
    await prisma.user.update({
      where: { address: from },
      data: {
        balance: {
          decrement: amount,
        },
      },
    })
    
    // Update story owner's balance (add)
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })
    
    if (story) {
      await prisma.user.update({
        where: { address: story.userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      })
    }

    // Calculate platform fee
const platformFee = amount * 0.05 // 5%
const creatorAmount = amount - platformFee

// Creator gets 95%
await prisma.user.update({
  where: { address: story.userId },
  data: { balance: { increment: creatorAmount } },
})

// YOU get 5%
await prisma.user.upsert({
  where: { address: process.env.TREASURY_ADDRESS },
  update: { balance: { increment: platformFee } },
  create: { address: process.env.TREASURY_ADDRESS, balance: platformFee },
})
    
    return NextResponse.json({ value }, { status: 201 })
  } catch (error) {
    console.error('Add value error:', error)
    return NextResponse.json(
      { error: 'Failed to add value' },
      { status: 500 }
    )
  }
}