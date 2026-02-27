import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { address, platform, username, verified, platformData } = await request.json()
    
    if (!address || !platform || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Ensure user exists
    await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    })
    
    // Save verification
    const verification = await prisma.socialVerification.upsert({
      where: {
        userId_platform: {
          userId: address,
          platform,
        },
      },
      update: {
        username,
        verified,
        platformData,
      },
      create: {
        userId: address,
        platform,
        platformId: username, // Use username as ID for Base ecosystem
        username,
        verified,
        platformData,
      },
    })
    
    return NextResponse.json({ verification }, { status: 201 })
  } catch (error) {
    console.error('Save verification error:', error)
    return NextResponse.json(
      { error: 'Failed to save verification' },
      { status: 500 }
    )
  }
}