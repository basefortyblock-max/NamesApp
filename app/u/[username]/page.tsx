// app/u/[username]/page.tsx
// Single username profile + reader tip flow.
// Public route — anyone can browse, only wallet-holders can tip.

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileView } from "./profile-view"

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params
  const clean = username.replace(/^@/, "").toLowerCase()

  // Most-recent matching story (in case same username across platforms)
  const story = await prisma.story.findFirst({
    where: {
      username: { equals: clean, mode: "insensitive" },
    },
    include: {
      user: { select: { address: true, basename: true, tipTotal: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!story) notFound()

  const recentTips = await prisma.tip.findMany({
    where: { storyId: story.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return (
    <ProfileView
      story={{
        id: story.id,
        username: story.username,
        platform: story.platform,
        philosophy: story.philosophy,
        tipsCount: story.tipsCount,
        tipsTotal: story.tipsTotal,
        address: story.address || story.user.address,
        createdAt: story.createdAt.toISOString(),
        lastTipAt: story.lastTipAt?.toISOString() ?? null,
      }}
      recentTips={recentTips.map((t) => ({
        from: `${t.from.slice(0, 6)}...${t.from.slice(-4)}`,
        amount: t.amount,
        txHash: t.txHash,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  )
}
