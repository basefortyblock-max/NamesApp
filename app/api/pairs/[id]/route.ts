// app/api/pairs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pair = await prisma.pairedUsername.findUnique({
      where: { id },
    })

    if (!pair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 })
    }

    return NextResponse.json({ pair })
  } catch (error: any) {
    console.error('Get pair error:', error)
    return NextResponse.json({ error: 'Failed to fetch pair' }, { status: 500 })
  }
}