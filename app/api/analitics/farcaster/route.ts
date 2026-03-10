import { NextRequest, NextResponse } from 'next/server'

// Analytics stub — event tracking placeholder (no DB model yet)
export async function POST(request: NextRequest) {
  try {
    const { event, fid, storyId } = await request.json()

    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 })
    }

    // TODO: persist to DB when analyticsEvent model is added to schema
    console.log('[analytics/farcaster]', { event, fid, storyId })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
