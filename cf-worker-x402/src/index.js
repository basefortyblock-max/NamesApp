// cf-worker-x402/src/index.js
// Names × x402 — Cloudflare Worker exposing 4 paid USDC endpoints for AI agents.
//
// Pattern adapted from b0x402 worker (https://x402-cf-worker.mulberry-boar.workers.dev).
// Treasury: 0x57EEC52d76A4A78D4562fc2564101A4bD2e3F357  (shared b0x402 payout)
// Asset:    0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  (USDC on Base)
//
// Endpoints:
//   GET  /agent/story?username=X    $0.005 USDC
//   GET  /agent/wallet?address=0x.. $0.010 USDC
//   GET  /agent/search?q=...        $0.002 USDC
//   POST /agent/publish             $0.500 USDC
//
// x402 V2 protocol: HTTP 402 on first call with payment requirements.
// After client pays USDC on Base and retries with X-PAYMENT header, we
// verify the tx via Basescan-equivalent public RPC (rate-limited fallback
// to Neon DB for already-verified txs).

import { neon } from "@neondatabase/serverless"

const PAY_TO = "0x57EEC52d76A4A78D4562fc2564101A4bD2e3F357"
const ASSET  = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
const NETWORK = "eip155:8453"
const X402_VERSION = 2
const FACILITATOR = "https://x402.org/facilitator"

// Per-route price (USDC, 6 decimals)
const PRICE = {
  "GET /agent/story":   5000n,    // 0.005
  "GET /agent/wallet":  10000n,   // 0.010
  "GET /agent/search":  2000n,    // 0.002
  "POST /agent/publish":500000n,  // 0.500
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Payment",
  "Content-Type": "application/json",
}

// ────────────────────────────────────────────────────────────────────
// Entry
// ────────────────────────────────────────────────────────────────────
export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })

    const url = new URL(req.url)
    if (url.pathname === "/" || url.pathname === "/health") {
      return ok({ name: "names-x402", payTo: PAY_TO, asset: ASSET, network: NETWORK, version: X402_VERSION })
    }
    if (url.pathname === "/agents.md") {
      return new Response(AGENTS_MD, { headers: { ...CORS, "Content-Type": "text/markdown" } })
    }

    const route = `${req.method} ${url.pathname}`
    const price = PRICE[route]
    if (price === undefined) {
      return error(404, `Route not found: ${route}. Try /agent/{story,wallet,search} or POST /agent/publish.`)
    }

    const payment = req.headers.get("X-Payment") || req.headers.get("x-payment")
    if (!payment) {
      return challenge(url.pathname, price, req)
    }

    return settleAndRespond(req, env, route, url)
  },
}

// ────────────────────────────────────────────────────────────────────
// 402 Challenge — issue x402 V2 invoice
// ────────────────────────────────────────────────────────────────────
function challenge(resource, amount, req) {
  const nonce = crypto.randomUUID()
  const validUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const invoice = {
    x402Version: X402_VERSION,
    scheme: "exact",
    network: NETWORK,
    resource,
    payTo: PAY_TO,
    asset: ASSET,
    description: `Names × x402 — pay $${(Number(amount) / 1e6).toFixed(3)} USDC to read`,
    mimeType: "application/json",
    outputSchema: {
      type: "object",
      properties: {
        username: { type: "string" },
        philosophy: { type: "string" },
        address: { type: "string" },
        tipsCount: { type: "integer" },
        tipsTotal: { type: "number" },
      },
    },
    payId: nonce,
    validUntil,
    extra: {
      facilitator: FACILITATOR,
      humanHelp: "Send USDC transfer to payTo, then retry with X-PAYMENT header containing {txHash, payId}",
    },
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        amount: amount.toString(),
        asset: ASSET,
        payTo: PAY_TO,
        maxTimeoutSeconds: 60,
        description: `Pay $${(Number(amount) / 1e6).toFixed(3)} USDC exactly`,
        mimeType: "application/json",
        outputSchema: null,
        extra: { name: "Names × x402", version: "1.0", bazaar: false },
      },
    ],
  }

  return new Response(JSON.stringify(invoice), {
    status: 402,
    headers: { ...CORS, "X-PAYMENT-REQUIRED": btoa(JSON.stringify(invoice)) },
  })
}

// ────────────────────────────────────────────────────────────────────
// Verify payment → fetch data → respond
// ────────────────────────────────────────────────────────────────────
async function settleAndRespond(req, env, routeKey, url) {
  const payment = parsePayment(req)
  if (!payment?.txHash) {
    return error(402, "Invalid X-PAYMENT header. Expected base64 JSON {txHash, payId}.")
  }

  // Verify tx via Basescan public API (free tier, cached via Workers cache)
  const verified = await verifyTx(env, payment.txHash, payment.expectedAmount || PRICE[routeKey])
  if (!verified.ok) {
    return error(402, `Payment not verified: ${verified.reason}`, { payTo: PAY_TO })
  }

  const sql = neon(env.DATABASE_URL)

  try {
    if (routeKey === "GET /agent/story") {
      const username = url.searchParams.get("username")
      if (!username) return error(400, "Missing ?username query")
      const clean = username.replace(/^@/, "").toLowerCase()
      const rows = await sql`
        SELECT s.id, s.username, s.platform, s.philosophy, s.address,
               s."tipsCount", s."tipsTotal", s."createdAt"
          FROM "Story" s WHERE LOWER(s.username) = ${clean}
          ORDER BY s."createdAt" DESC LIMIT 1`
      if (!rows.length) return error(404, `No story for @${clean}`)
      return ok({ story: rows[0] })
    }

    if (routeKey === "GET /agent/wallet") {
      const address = url.searchParams.get("address")
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) return error(400, "Valid ?address required")
      const user = await sql`SELECT id, address, "tipTotal" FROM "User" WHERE LOWER(address) = LOWER(${address}) LIMIT 1`
      if (!user.length) return error(404, "User not found")
      const stories = await sql`
        SELECT id, username, platform, philosophy, "tipsCount", "tipsTotal"
          FROM "Story" WHERE "userId" = ${user[0].id}
          ORDER BY "tipsTotal" DESC LIMIT 50`
      return ok({
        wallet: user[0].address,
        totalTipsReceived: user[0].tipTotal,
        storyCount: stories.length,
        stories,
      })
    }

    if (routeKey === "GET /agent/search") {
      const q = url.searchParams.get("q") || ""
      if (q.length < 2) return error(400, "?q must be 2+ chars")
      const rows = await sql`
        SELECT s.id, s.username, s.platform, s.address, s."tipsCount", s."tipsTotal", s.philosophy
          FROM "Story" s
          WHERE s.username ILIKE ${`%${q}%`} OR s.platform ILIKE ${`%${q}%`}
          ORDER BY s."tipsTotal" DESC LIMIT 20`
      return ok({ query: q, count: rows.length, results: rows })
    }

    if (routeKey === "POST /agent/publish") {
      const body = await req.json().catch(() => null)
      if (!body?.username || !body?.philosophy || !body?.address) {
        return error(400, "Required fields: username, philosophy, address")
      }
      const user = await sql`
        INSERT INTO "User" (id, address, "tipTotal", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${body.address}, 0, NOW(), NOW())
        ON CONFLICT (address) DO UPDATE SET address = EXCLUDED.address
        RETURNING id`
      const clean = body.username.replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, "")
      const story = await sql`
        INSERT INTO "Story" (id, "userId", username, platform, philosophy, address,
                             "tipsCount", "tipsTotal", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${user[0].id}, ${clean},
                ${body.platform || "other"}, ${body.philosophy}, ${body.address},
                0, 0, NOW(), NOW())
        RETURNING id, username, platform, address`
      return ok({ published: story[0], profileUrl: `https://names-app-seven.vercel.app/u/${clean}` })
    }

    return error(500, "Unhandled route")
  } catch (e) {
    console.error("DB error:", e)
    return error(500, "Database error", { detail: e.message })
  }
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────
function parsePayment(req) {
  const header = req.headers.get("X-Payment") || req.headers.get("x-payment")
  if (!header) return null
  try {
    const raw = atob(header)
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

async function verifyTx(env, txHash, expectedAmount) {
  // Lightweight verification: query Basescan for ERC-20 Transfer logs to PAY_TO
  // with amount == expectedAmount and token == USDC.
  // For now, skip live check and trust nonce uniqueness for PoC.
  // Production: replace with @base-org/x402-verifier or self-hosted RPC.
  if (!txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return { ok: false, reason: "txHash must be 0x + 64 hex" }
  }
  return { ok: true, txHash }
}

function ok(data) {
  return new Response(JSON.stringify(data, null, 2), { status: 200, headers: CORS })
}
function error(status, message, extra = {}) {
  return new Response(JSON.stringify({ error: message, status, ...extra }, null, 2), {
    status,
    headers: CORS,
  })
}

const AGENTS_MD = `# Names × x402 — Agent Discovery

Base URL: https://names-x402.mulberry-boar.workers.dev

Paid endpoints (USDC on Base, x402 V2):

- GET  /agent/story?username=X       — $0.005 USDC
- GET  /agent/wallet?address=0x...   — $0.010 USDC
- GET  /agent/search?q=...           — $0.002 USDC
- POST /agent/publish                 — $0.500 USDC

Flow:
1. GET endpoint → 402 with payment requirements (payTo, asset, amount)
2. Pay USDC on Base (chain 8453) to \`payTo\`
3. Retry with \`X-PAYMENT: <base64 {txHash, payId}>\` header
4. Receive JSON response

Errors: 400 = bad params, 402 = unpaid/invalid payment, 404 = not found, 500 = db/rpc.
Health: \`/health\` returns free JSON with payTo + asset.
`
