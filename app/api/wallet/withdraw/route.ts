import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { address, amount } = await request.json()
    
    if (!address || !amount || amount < 1) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount (minimum $1)' },
        { status: 400 }
      )
    }
    
    // Check user balance
    const user = await prisma.user.findUnique({
      where: { address },
    })
    
    if (!user || user.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }
    
    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: address,
        address,
        amount,
        status: 'pending',
      },
    })
    
    // Deduct from user balance
    await prisma.user.update({
      where: { address },
      data: {
        balance: {
          decrement: amount,
        },
      },
    })
    
    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: address,
        type: 'withdraw',
        amount,
        status: 'pending',
      },
    })
    
    return NextResponse.json({ withdrawal }, { status: 201 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}