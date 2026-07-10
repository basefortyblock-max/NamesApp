// app/api/stories/[id]/tip/route.ts
// Records an onchain USDC tip → story's tipsCount + tipsTotal.
// txHash required — must be called AFTER OnchainKit Transaction success.
// Idempotent on txHash (UNIQUE constraint).

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { from, amount, txHash } = await request.json()

    if (!from || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: from, amount" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number" || amount < 0.10) {
      return NextResponse.json(
        { error: "Minimum $0.10 USDC required" },
        { status: 400 }
      )
    }

    if (!txHash) {
      return NextResponse.json(
        { error: "txHash required — must be called after onchain confirmation" },
        { status: 400 }
      )
    }

    const story = await prisma.story.findUnique({
      where: { id },
      select: { id: true, tipsTotal: true, userId: true, username: true, user: { select: { id: true } } },
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Idempotent tip record (DOES throw if dup txHash — caller safe-handles)
    const tip = await prisma.tip.create({
      data: { storyId: id, from, amount, txHash },
    })

    await prisma.story.update({
      where: { id },
      data: {
        tipsCount: { increment: 1 },
        tipsTotal: { increment: amount },
        lastTipAt: new Date(),
      },
    })

    // Mirror to user.total
    await prisma.user.update({
      where: { id: story.user.id },
      data: { tipTotal: { increment: amount } },
    })

    return NextResponse.json(
      {
        success: true,
        tip,
        newTipsTotal: story.tipsTotal + amount,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Tip already recorded (duplicate txHash)" },
        { status: 200 }
      )
    }
    console.error("tip error:", error)
    return NextResponse.json(
      { error: "Failed to record tip" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const limit = Math.min(
      parseInt(new URL(request.url).searchParams.get("limit") || "20"),
      100
    )

    const tips = await prisma.tip.findMany({
      where: { storyId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ tips, limit })
  } catch (e) {
    console.error("get tips error:", e)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
