// app/api/pairs/mint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT || '0x0000000000000000000000000000000000000000'

export async function POST(request: NextRequest) {
  try {
    const { address, username1, platform1, username2, platform2 } = await request.json()

    if (!address || !username1 || !username2 || !platform1 || !platform2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Removed platform check — same platform is allowed
    // Only check that the two usernames are different
    if (username1 === username2) {
      return NextResponse.json(
        { error: 'Please select 2 different usernames' },
        { status: 400 }
      )
    }

    // ✅ Fixed verification query — lookup user by address first, then check stories
    // Previous query used userId: address which is wrong (userId is cuid, not wallet address)
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        stories: {
          where: {
            OR: [
              { username: username1, platform: platform1 },
              { username: username2, platform: platform2 },
            ],
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please connect your wallet and publish a story first.' },
        { status: 400 }
      )
    }

    if (user.stories.length < 2) {
      return NextResponse.json(
        { error: 'Both usernames must belong to your account. Please publish stories for both usernames first.' },
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

    console.log(`[Mint Pair] Contract: ${CONTRACT_ADDRESS}, creator: ${address}`)

    const pair = await prisma.pairedUsername.create({
      data: {
        username1,
        platform1,
        username2,
        platform2,
        pairedName,
        creator: address,
        currentPrice: 0.7,
        forSale: false,
      },
    })

    return NextResponse.json({ success: true, pair }, { status: 201 })

  } catch (error: any) {
    console.error('Mint pair error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This username pair already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to mint paired username',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    const pairs = await prisma.pairedUsername.findMany({
      where: { creator: address },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ pairs })

  } catch (error: any) {
    console.error('Get pairs error:', error)
    return NextResponse.json({ error: 'Failed to fetch pairs' }, { status: 500 })
  }
}