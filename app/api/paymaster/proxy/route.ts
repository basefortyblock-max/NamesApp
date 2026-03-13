import { NextRequest, NextResponse } from 'next/server'

// Proxy tipis — API key tidak pernah sampai ke browser
export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(process.env.PAYMASTER_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}