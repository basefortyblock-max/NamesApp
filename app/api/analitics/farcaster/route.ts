// app/api/analytics/farcaster/route.ts
export async function POST(request: NextRequest) {
  const { event, fid, storyId } = await request.json()
  
  // Track events:
  // - frame_viewed
  // - button_clicked
  // - shared_to_fc
  // - value_sent
  
  await prisma.analyticsEvent.create({
    data: {
      event,
      fid: fid?.toString(),
      storyId,
      platform: 'farcaster',
    },
  })
  
  return NextResponse.json({ success: true })
}