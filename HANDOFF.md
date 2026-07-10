# HANDOFF — NAMES × x402 v2

**PR**: https://github.com/basefortyblock-max/NamesApp/pull/2
**Branch**: `feature/cleanup-no-paymaster`
**Author**: prpo_ai (signing as "Names × x402 rebuild")
**Scope**: 50 files, -5058 / +1404 (net **−3654 lines**)

---

## What changed at a glance

### Frontend (Vercel)
- ❌ Removed: NFT pair UI, paymaster gasless, OAuth multi-platform, dead wallet withdraw, duplicate comments/likes routes
- ✅ New: `/u/[username]` profile route, `/api/stories/[id]/tip` endpoint (idempotent), `/about` rewritten for x402 model
- ✅ Simplified: `app/page.tsx` (feed by tips), `app/write/page.tsx` (3-step), `app/explore/page.tsx` (filter)
- ✅ Cleanup: removed "Pair" nav item, removed deprecated components

### Database
- Schema: 8 tables → **3 tables** (User, Story, Tip)
- Migration: `prisma/migrations/20260710000000_simplified_schema/migration.sql`

### CF Worker (Cloudflare)
- Module: `cf-worker-x402/`
- 4 paid x402 V2 endpoints (USDC on Base, chain 8453)
- Treasury: `0x57EEC52d76A4A78D4562fc2564101A4bD2e3F357` (shared b0x402)
- Pricing:
  - `GET  /agent/story`   $0.005
  - `GET  /agent/wallet`  $0.010
  - `GET  /agent/search`  $0.002
  - `POST /agent/publish` $0.500

---

## Deploy steps (for you, no PAT required)

### 1. Merge PR when ready
- Open: https://github.com/basefortyblock-max/NamesApp/pull/2
- Review the diff, approve, merge
- Vercel will auto-deploy v2 **once env vars match**:
  - `DATABASE_URL` (Neon Postgres — same instance as v1, so reuse)
  - `NEXT_PUBLIC_BASE_URL` (or default to asset's domain)

### 2. Run Prisma migration on production
```bash
# Locally (or via Vercel build env override)
DATABASE_URL="<prod-url-here>" npx prisma migrate deploy
```

> ⚠ **Backup v1 data first**. v1 tables will be DROPPED. Migration is
> irreversible. Existing story texts, comments, transactions → preserved
> before migration if needed by `pg_dump`.

### 3. Deploy CF Worker (`names-x402`)
Two options, no PAT needed from me:

#### Option A — wrangler CLI on your laptop
```bash
cd cf-worker-x402
npm install                 # or pnpm install
npx wrangler login          # browser login, picks your CF account
npx wrangler secret put DATABASE_URL   # paste Neon URL
npx wrangler deploy
# Will output: https://names-x402.<your-subdomain>.workers.dev
```

#### Option B — from Vercel (zero command line)
1. Open https://dash.cloudflare.com → Workers & Pages → Create Worker
2. Paste `cf-worker-x402/src/index.js`
3. Add secret `DATABASE_URL` in Settings → Variables
4. Deploy → get URL, replace `basefortyblock-max/NAMES-X402` worker name

### 4. Test x402 endpoints live
```bash
curl -i https://names-x402.<your>.workers.dev/health
# 200 { name: "names-x402", payTo: "0x57EEC52d..." }

curl -i https://names-x402.<your>.workers.dev/agent/story?username=foo
# 402 with payment requirements JSON
```

### 5. Submit to x402scan.org
- Open https://x402scan.org/submit
- Paste CF Worker URL
- They auto-index in 24-48h
- Re-submit for visibility on `/agents` directory

---

## Bypasses (for QA only)

Worker uses `X402_BYPASS` env var per build. Default: **disabled in production**.

To test without real USDC during dev:
```bash
npx wrangler dev
# Then add 'X-PAYMENT: eyJ0eEhhc2giOiIweC4uLn0=' header (base64 of {txHash place})
# OR set X402_BYPASS=true env → auto-passes
```

---

## Repository state

```
/root/NamesApp_clean/    ← local clone, branch feature/cleanup-no-paymaster
├── app/                  ← simplified routes
├── components/           ← 8 → 6 components
├── lib/                  ← 8 → 4 lib files (removed paymaster, smart-contract, oauth, verification)
├── prisma/schema.prisma  ← 3-table schema
├── prisma/migrations/0_init/
├── prisma/migrations/20260710000000_simplified_schema/   ← migration 2
├── cf-worker-x402/       ← NEW module
│   ├── src/index.js
│   ├── wrangler.toml
│   └── package.json
├── README.md             ← rewritten for v2
├── .well-known/agents.md ← for AI agent discovery
├── package.json          ← slimmed deps
└── (next.config, tsconfig, tailwind, postcss — unchanged)
```

---

## Tokens & cleanup

### My session env
- I have your GH PAT in this session only (30-day expiry you set). It was
  used to: clone repo, create branch, push, open PR #2.
- I will NOT persist it anywhere. Once this session ends, env var is gone.

### For you to do
1. **Rotate the PAT** after PR is processed (good hygiene):
   https://github.com/settings/tokens?type=beta → revoke
2. **Or wait** — it's fine until 30-day expiry. Up to you.

If you want me to do further work (deploy Worker, expand endpoints,
multi-language NEAR API, etc.), drop the CF API token and I'll continue.
Or use my reply box in next session — I have the context.

---

## Files I DID NOT touch

- `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.*`
- `components/{app-header,error-boundary,farcaster-ready,farcaster-auto-connect,connect-wallet-button}.tsx`
  — kept as-is; they had no dependencies on removed modules
- `lib/{wagmi,wallet-context,prisma,utils,constants,stories-context}.ts`
  — kept, used by feed/profile/write
- `components/bottom-nav.tsx` — small edit only (removed Pair nav)
- `app/layout.tsx`, `providers.tsx` — unchanged
- `app/story/[id]/frame/route.tsx` — kept (Farcaster Frame embed still useful)

---

## Known limitations I've not fixed

1. **x402 verification is stub** — accepts any 64-hex txHash for now.
   Production requires Basescan-compatible USDC transfer log check.
   Recommended: integrate `@base-org/x402-verifier` or self-hosted RPC.
2. **No demo stories** — migration drops all v1 stories. v2 launches to empty feed. You'll need to either:
   - Re-publish manually
   - Re-enable data migration (write SQL `INSERT INTO Story SELECT ...` from `pg_dump`)
3. **No tip badges** (Top Supporter etc.) — that's phase 2 of v2.
4. **Mobile-only nav** — bottom-nav is fixed. Desktop users see it small at bottom. Acceptable for mobile-first.

---

## Contact

I am `prpo_ai`, your autonomous AI employee running on Hermes Agent.
You can reach me again in this session or any future session — I have
persistent memory.

For urgent collaboration: Telegram @mmx3prpo_bot

— prpo_ai, 2026-07-10
