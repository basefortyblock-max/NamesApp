"use client"

import Link from "next/link"
import {
  PenSquare,
  Search,
  Heart,
  BookOpen,
  DollarSign,
  Sparkles,
  Globe,
  ArrowRight,
  Shield,
} from "lucide-react"
import { WalletConnect } from "@/components/connect-wallet-button"
import { useAccount } from "wagmi"

const WHY_REASONS = [
  {
    icon: BookOpen,
    title: "Your Name Has a Story",
    description:
      "Every username carries history, meaning, or a purpose. Names lets you share what yours is about.",
  },
  {
    icon: Globe,
    title: "Built for the Agent Era",
    description:
      "Names speaks x402 — AI agents pay tiny USDC amounts to read profiles. No accounts, no OAuth, no paywalls.",
  },
  {
    icon: DollarSign,
    title: "Earn From What You Care About",
    description:
      "Readers tip directly in USDC. No platform fee. Tips are onchain — same wallet, same receipt, no middleman.",
  },
  {
    icon: Sparkles,
    title: "Discovered Where It Counts",
    description:
      "Top stories rise on the feed. AI agents cite yours in their answers. Your username becomes valuable.",
  },
]

const HOW_STEPS = [
  {
    step: "01",
    icon: PenSquare,
    title: "Write Your Philosophy",
    description:
      "Type your username and the story behind it. Up to 490 words. Hit publish.",
  },
  {
    step: "02",
    icon: Shield,
    title: "Sign with Your Wallet",
    description:
      "One signature proves ownership. No account to create, no email to verify.",
  },
  {
    step: "03",
    icon: Heart,
    title: "Receive USDC Tips",
    description:
      "Anyone — human or AI agent — can tip through your profile. Tips land in your wallet directly.",
  },
  {
    step: "04",
    icon: Globe,
    title: "Get Found by Agents",
    description:
      "We expose profile data via x402 endpoints. AI agents pay $0.005 USDC to look up your username.",
  },
]

export default function AboutPage() {
  const { isConnected } = useAccount()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <section className="py-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          Names × x402
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
          Share the story behind your username. Earn USDC when humans and AI
          agents find it valuable.
        </p>
      </section>

      <section className="py-6">
        <h2 className="text-lg font-bold">Why Names?</h2>
        <div className="mt-5 flex flex-col gap-4">
          {WHY_REASONS.map((r) => (
            <div
              key={r.title}
              className="flex gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {r.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-6">
        <h2 className="text-lg font-bold">How It Works</h2>
        <div className="mt-5 flex flex-col gap-5">
          {HOW_STEPS.map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {item.step}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 text-center">
        <div className="rounded-xl bg-primary p-6 text-primary-foreground">
          <h2 className="text-lg font-bold">Ready to Share?</h2>
          <p className="mt-1 text-sm text-primary-foreground/85">
            Connect your wallet to publish your story.
          </p>
          <div className="mt-5">
            {isConnected ? (
              <Link
                href="/write"
                className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-2.5 text-base font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
              >
                Publish Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="inline-flex">
                <WalletConnect />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
