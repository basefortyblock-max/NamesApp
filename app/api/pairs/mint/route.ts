// app/api/pairs/mint/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get contract address from environment - can be swapped without code changes
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT || '0x0000000000000000000000000000000000000000'

export async function POST(request: NextRequest) {
  try {
    const { address, username1, platform1, username2, platform2 } = await request.json()
    
    // Validation
    if (!address || !username1 || !username2 || !platform1 || !platform2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check platforms are different
    if (platform1 === platform2) {
      return NextResponse.json(
        { error: 'Please select accounts from different platforms' },
        { status: 400 }
      )
    }
    
    // Verify both accounts belong to user
    const verifications = await prisma.socialVerification.findMany({
      where: {
        userId: address,
        OR: [
          { username: username1, platform: platform1 },
          { username: username2, platform: platform2 },
        ],
      },
    })
    
    if (verifications.length !== 2) {
      return NextResponse.json(
        { error: 'Both accounts must be verified by you. Please verify them first in the Write page.' },
        { status: 400 }
      )
    }
    
    // Generate paired name
    const pairedName = `${username1}×${username2}`
    
    // Check if pair already exists
    const existingPair = await prisma.pairedUsername.findUnique({
      where: { pairedName },
    })
    
    if (existingPair) {
      return NextResponse.json(
        { error: 'This username pair already exists' },
        { status: 400 }
      )
    }
    
    // Create pair
    // Note: In production, smart contract call would happen here using CONTRACT_ADDRESS
    // Contract address: ${CONTRACT_ADDRESS}
    // For now, we create the database record with contract address logged
    console.log(`[Mint Pair] Using contract: ${CONTRACT_ADDRESS}`)
    const pair = await prisma.pairedUsername.create({
      data: {
        username1,
        platform1,
        username2,
        platform2,
        pairedName,
        creator: address,
        currentPrice: 0.7, // Starting price
        forSale: false,
      },
    })
    
    return NextResponse.json({ 
      success: true,
      pair 
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Mint pair error:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This username pair already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to mint paired username',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET - Get pair details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400 }
      )
    }
    
    const pairs = await prisma.pairedUsername.findMany({
      where: { creator: address },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ pairs })
    
  } catch (error: any) {
    console.error('Get pairs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pairs' },
      { status: 500 }
    )
  }
}
