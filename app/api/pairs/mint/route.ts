// app/api/pairs/mint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT || ''

export async function POST(request: NextRequest) {
  try {
    const {
      address,
      username1, platform1,
      username2, platform2,
      tokenId,       // ✅ uint256 from contract event (optional for legacy)
      txHash,        // ✅ onchain mint tx hash
    } = await request.json()

    if (!address || !username1 || !username2 || !platform1 || !platform2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (username1 === username2) {
      return NextResponse.json({ error: 'Please select 2 different usernames' }, { status: 400 })
    }

    // Verify both usernames belong to this wallet
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
        { error: 'User not found. Connect wallet and publish a story first.' },
        { status: 400 }
      )
    }

    if (user.stories.length < 2) {
      return NextResponse.json(
        { error: 'Both usernames must belong to your account.' },
        { status: 400 }
      )
    }

    const pairedName = `${username1}×${username2}`

    const existingPair = await prisma.pairedUsername.findUnique({
      where: { pairedName },
    })

    if (existingPair) {
      return NextResponse.json({ error: 'This username pair already exists' }, { status: 400 })
    }

    console.log(`[Mint] Contract: ${CONTRACT_ADDRESS}, tokenId: ${tokenId}, creator: ${address}`)

    const pair = await prisma.pairedUsername.create({
      data: {
        username1,
        platform1,
        username2,
        platform2,
        pairedName,
        creator: address,
        ownerAddress: address,  // ✅ creator is initial owner
        tokenId: tokenId ? parseInt(tokenId.toString()) : null, // ✅ save uint256 tokenId
        currentPrice: 0.7,
        forSale: false,
      },
    })

    // If onchain mint — record it as a trade
    if (txHash && tokenId) {
      await prisma.trade.create({
        data: {
          pairedUsernameId: pair.id,
          from: address,
          type: 'mint',
          price: 0.7,
          txHash,
          status: 'confirmed',
        },
      }).catch(() => {}) // non-blocking
    }

    return NextResponse.json({ success: true, pair }, { status: 201 })

  } catch (error: any) {
    console.error('Mint pair error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This username pair already exists' }, { status: 400 })
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