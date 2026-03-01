import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { address, enabled } = await request.json()
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { address } })
    if (!user) {
      user = await prisma.user.create({ data: { address } })
    }

    // Update pairing status
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { openForPairing: enabled },
    })

    return NextResponse.json({ success: true, openForPairing: updated.openForPairing })
  } catch (error: any) {
    console.error('Toggle pairing error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { address } })
    
    return NextResponse.json({ 
      openForPairing: user?.openForPairing || false 
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}