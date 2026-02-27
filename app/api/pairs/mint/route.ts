import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { address, username1, platform1, username2, platform2 } = await request.json()
    
    if (!address || !username1 || !username2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Verify both accounts belong to user
    const verifications = await prisma.socialVerification.findMany({
      where: {
        userId: address,
        username: {
          in: [username1, username2],
        },
      },
    })
    
    if (verifications.length !== 2) {
      return NextResponse.json(
        { error: 'Both accounts must be verified by you' },
        { status: 400 }
      )
    }
    
    // Generate paired name
    const pairedName = `${username1}×${username2}`
    
    // Create pair (smart contract call would happen here)
    const pair = await prisma.pairedUsername.create({
      data: {
        username1,
        platform1,
        username2,
        platform2,
        pairedName,
        creatorId: address,
      },
    })
    
    return NextResponse.json({ pair }, { status: 201 })
  } catch (error) {
    console.error('Mint pair error:', error)
    return NextResponse.json(
      { error: 'Failed to mint paired username' },
      { status: 500 }
    )
  }
}