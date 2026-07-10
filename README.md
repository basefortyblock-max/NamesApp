# Names × x402 — v2.0

**Names app for the agent era.** Publish short philosophies about your
username, tip creators in USDC on Base, and let AI agents discover you via
x402-compatible endpoints.

## What's new in v2

- ❌ Removed: NFT pairing, smart contract mint/trade, paymaster gasless sponsor
- ❌ Removed: oauth/multi-platform verification stubs, dead wallet endpoints
- ❌ Removed: tip-by-appreciation with 5% price-increment (jadul model)
- ✅ **x402 V2 agent endpoints** — paid USDC API for AI agents
- ✅ Simplified data model: User + Story + Tip (was 8 tables, now 3)
- ✅ Direct USDC tip flow (user pays gas, ~$0.001 ETH)
- ✅ Public agent discovery at `/.well-known/agents.md`

## Stack

- Frontend: Next.js 16, React 19, Wagmi v2, OnchainKit, RainbowKit
- Backend: Next.js API routes + PostgreSQL (Prisma 7)
- Smart contract: NONE — full peer-to-peer philosophy
- Wallet: Coinbase Smart Wallet (Base native), MetaMask
- x402 endpoints: Cloudflare Worker (`names-x402.mulberry-boar.workers.dev`)

## User flows

### Publish

1. Connect wallet → /write
2. Type username + platform + philosophy (1-490 words)
3. Sign one verification message
4. Published. Listed on feed by total tips.

### Tip (human or AI)

1. Reader opens /u/[username]
2. Click "Tip"
3. Enter amount (min $0.10 USDC; suggested \$0.10/\$0.50/\$1/\$5)
4. Sign USDC transfer on Base
5. Tip TX hash recorded in DB; story's tipsCount + tipsTotal +1

### Discover (by AI agent)

```
GET https://names-x402.mulberry-boar.workers.dev/agent/story?username=foo
→ 402 invoice → pay $0.005 USDC → JSON story data
```

See `/.well-known/agents.md` for full endpoint list.

## Routes (UI)

| Path | Description |
|------|-------------|
| `/` | Feed — top stories by tips |
| `/u/[username]` | Public profile |
| `/write` | Publish your story |
| `/explore` | Search |
| `/about` | About page |

## Routes (API)

| Path | Description |
|------|-------------|
| `GET  /api/stories?sort=tips|recent&platform=...` | Feed listing |
| `POST /api/stories` | Publish a philosophy |
| `GET  /api/stories/[id]` | Single story |
| `POST /api/stories/[id]/tip` | Record onchain tip |
| `GET  /api/stories/[id]/tip` | Recent tips list |

## x402 endpoints (CF Worker)

| Path | Cost | Description |
|------|------|-------------|
| `GET  /agent/story` | $0.005 | username → story |
| `GET  /agent/wallet` | $0.010 | wallet → stories |
| `GET  /agent/search` | $0.002 | search |
| `POST /agent/publish` | $0.500 | submit philosophy |

All settle USDC on Base (chain 8453) to the b0x402 treasury.

## Local development

```bash
pnpm install
cp .env.example .env.local
# Edit DATABASE_URL, NEXT_PUBLIC_BASE_URL
pnpm dev
```

## Deploy

Vercel auto-deploys on push. Set these env vars in Vercel:

- `DATABASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_USERNAME_NFT_CONTRACT` (legacy, unused)
- frame/og config defaults inline

CF Worker `names-x402` deploys independently — see `cf-worker-names-x402/`.

## Migration from v1

Existing v1 stories + users remain operational on the Vercel instance until
admin chooses to run `prisma migrate deploy` after backup. v2 schema is
**breaking**: v1 StoryValue/Tip/Receipt data is not migrated.

## License

MIT — inherited from v1.
