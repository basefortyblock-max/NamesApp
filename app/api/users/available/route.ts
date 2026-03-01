import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get list of users available for pairing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currentAddress = searchParams.get('currentAddress')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    if (!currentAddress) {
      return NextResponse.json(
        { error: 'currentAddress required' },
        { status: 400 }
      )
    }

    // Get users open for pairing, excluding the current user
    const users = await prisma.user.findMany({
      where: {
        openForPairing: true,
        address: { not: currentAddress },
      },
      select: {
        id: true,
        address: true,
        basename: true,
        balance: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Get total count for pagination
    const total = await prisma.user.count({
      where: {
        openForPairing: true,
        address: { not: currentAddress },
      },
    })

    // Also get their verified accounts for context
    const usersWithVerifications = await Promise.all(
      users.map(async (user) => {
        const verifications = await prisma.socialVerification.findMany({
          where: { userId: user.id },
          select: {
            platform: true,
            username: true,
            verified: true,
          },
        })

        return {
          ...user,
          verifications,
        }
      })
    )

    return NextResponse.json({
      users: usersWithVerifications,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    })
  } catch (error: any) {
    console.error('Get available users error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch available users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
