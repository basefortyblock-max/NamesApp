import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }
    
    const user = await prisma.user.findUnique({
      where: { address },
      select: {
        balance: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })
    
    if (!user) {
      return NextResponse.json({
        balance: 0,
        transactions: [],
      })
    }
    
    return NextResponse.json({
      balance: user.balance,
      transactions: user.transactions,
    })
  } catch (error) {
    console.error('Get balance error:', error)
    return NextResponse.json(
      { error: 'Failed to get balance' },
      { status: 500 }
    )
  }
}