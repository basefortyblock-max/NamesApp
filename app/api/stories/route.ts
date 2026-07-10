// app/api/stories/route.ts
// GET: list stories (feed) — sort by tipsTotal desc by default
// POST: publish a new philosophy (offchain, requires Prisma write)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get("sort") || "tips"
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")
    const platform = searchParams.get("platform")

    const orderBy =
      sort === "recent"
        ? { createdAt: "desc" as const }
        : { tipsTotal: "desc" as const }

    const stories = await prisma.story.findMany({
      where: platform ? { platform } : undefined,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        user: { select: { address: true, basename: true } },
      },
    })

    const out = stories.map((s: (typeof stories)[number]) => ({
      id: s.id,
      username: s.username,
      platform: s.platform,
      philosophy: s.philosophy,
      tipsCount: s.tipsCount,
      tipsTotal: s.tipsTotal,
      lastTipAt: s.lastTipAt,
      createdAt: s.createdAt,
      address: s.address || s.user?.address || "",
    }))

    return NextResponse.json({
      success: true,
      count: out.length,
      stories: out,
    })
  } catch (e) {
    console.error("feed error:", e)
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, username, platform, philosophy } = await request.json()

    if (!address || !username || !platform || !philosophy) {
      return NextResponse.json(
        { error: "Missing required fields: address, username, platform, philosophy" },
        { status: 400 }
      )
    }

    const wordCount = philosophy.trim().split(/\s+/).filter(Boolean).length
    if (wordCount === 0 || wordCount > 490) {
      return NextResponse.json(
        { error: `Philosophy must be 1-490 words (got ${wordCount})` },
        { status: 400 }
      )
    }

    // Username sanity — strip @, lowercase, alphanum+_- only
    const clean = username.replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, "")
    if (clean.length === 0 || clean.length > 32) {
      return NextResponse.json(
        { error: "Username must be 1-32 chars, alphanumeric/_/-" },
        { status: 400 }
      )
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    })

    // Idempotency: same (username, platform) keyed
    const existing = await prisma.story.findUnique({
      where: { username_platform: { username: clean, platform } },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Story already published for @${clean} on ${platform}` },
        { status: 409 }
      )
    }

    const story = await prisma.story.create({
      data: {
        userId: user.id,
        username: clean,
        platform,
        philosophy: philosophy.trim(),
        address,
      },
    })

    return NextResponse.json({ success: true, story }, { status: 201 })
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Story already exists" },
        { status: 409 }
      )
    }
    console.error("publish error:", e)
    return NextResponse.json(
      { error: "Failed to publish" },
      { status: 500 }
    )
  }
}
