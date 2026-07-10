-- Simplified Names × x402 schema drop
DROP TABLE IF EXISTS "Trade" CASCADE;
DROP TABLE IF EXISTS "PairedUsername" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "SocialVerification" CASCADE;
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "StoryValue" CASCADE;
DROP TABLE IF EXISTS "Story" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "basename" TEXT,
    "tipTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "philosophy" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tipsCount" INTEGER NOT NULL DEFAULT 0,
    "tipsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTipAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Story_username_platform_key" ON "Story"("username", "platform");
CREATE INDEX "Story_userId_idx" ON "Story"("userId");
CREATE INDEX "Story_tipsTotal_idx" ON "Story"("tipsTotal");
CREATE INDEX "Story_lastTipAt_idx" ON "Story"("lastTipAt");

CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tip_txHash_key" ON "Tip"("txHash");
CREATE INDEX "Tip_storyId_idx" ON "Tip"("storyId");
CREATE INDEX "Tip_from_idx" ON "Tip"("from");

ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tip" ADD CONSTRAINT "Tip_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
