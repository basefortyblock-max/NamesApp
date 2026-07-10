// app/api/stories/[id]/route.ts
// GET single story by id (used by agent/webhook integrations — humans use /u/[username]).
// note: writes now use /api/stories/[id]/tip — kept ONLY for backward compat / agent lookups.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        user: { select: { address: true, basename: true } },
      },
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    return NextResponse.json({
      story: {
        id: story.id,
        username: story.username,
        platform: story.platform,
        philosophy: story.philosophy,
        tipsCount: story.tipsCount,
        tipsTotal: story.tipsTotal,
        lastTipAt: story.lastTipAt,
        createdAt: story.createdAt,
        address: story.address || story.user.address || "",
      },
    })
  } catch (e) {
    console.error("get story:", e)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
