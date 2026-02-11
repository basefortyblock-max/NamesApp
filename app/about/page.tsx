"use client"

import Link from "next/link"
import {
  PenSquare,
  Search,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Zap,
  Globe,
  Users,
  ArrowRight,
  Shield,
} from "lucide-react"
import { useWallet } from "@/lib/wallet-context"

const WHY_REASONS = [
  {
    icon: BookOpen,
    title: "Your Name Has a Story",
    description:
      "Whether it's your Twitter handle, Base name, or project alias, every name carries history, meaning, and intention. Names represent who we are in the digital world.",
  },
  {
    icon: Globe,
    title: "Build on Base",
    description:
      "At Base, we move, create, and build channels that generate income from an inexhaustible source. From one or two words that represent a person: you, and all of us at Base.",
  },
  {
    icon: DollarSign,
    title: "Earn From Your Philosophy",
    description:
      "When others value the story behind your name, you earn USDC. The more your philosophy resonates, the higher the price grows organically.",
  },
  {
    icon: Users,
    title: "Connect With Others",
    description:
      "Discover the philosophy behind other usernames. Build meaningful connections through shared stories.",
  },
]

const HOW_STEPS = [
  {
    step: "01",
    icon: PenSquare,
    title: "Type Your Username",
    description:
      "Enter the username you want to share the philosophy about. It can be from any platform: Twitter, Base, Instagram, TikTok, Facebook, or any name you've chosen.",
  },
  {
    step: "02",
    icon: Search,
    title: "Automatic Detection & Verification",
    description:
      "The app automatically detects and verifies your Base profile. This ensures authenticity and links your story to your on-chain identity.",
  },
  {
    step: "03",
    icon: BookOpen,
    title: "Write Your Philosophy",
    description:
      "Write the philosophical or charismatic story behind your username. Is it historical? Brings good luck? Blessings? Health? Tell the world in any language.",
  },
  {
    step: "04",
    icon: DollarSign,
    title: "Earn USDC",
    description:
      "Your story starts at 0.7 USDC. When others appreciate and value your philosophy, the price increases. No gas fees, enjoy it.",
  },
]

const KEY_FEATURES = [
  {
    icon: Zap,
    title: "Gasless Transactions",
    description: "No gas fee for any transaction. Enjoy it.",
  },
  {
    icon: DollarSign,
    title: "Minimum 0.7 USDC",
    description: "The minimum price is the current story price. It only goes up.",
  },
  {
    icon: Shield,
    title: "Withdraw at $1",
    description: "An accumulated balance of $1 can be withdrawn to your main wallet.",
  },
  {
    icon: Globe,
    title: "Multilingual",
    description: "Write stories in your own language. Multilingual options based on location.",
  },
]

export default function AboutPage() {
  const { isConnected, connect } = useWallet()

  return (
    <div className="mx-auto max-w-2xl">
      {/* Hero */}
      <section className="px-4 py-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <span className="text-2xl font-bold text-primary-foreground">N</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          The Charismatic Philosophy Behind Your Username
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
          App Names represent the philosophy of your username, whether it's Twitter, Base, Instagram,
          TikTok, Facebook, a project name, or any name you choose for any blockchain platform.
        </p>
      </section>

      {/* Why Names */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground">Why Names?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell the world why you chose that name. Is it historical, brings good luck, brings
          blessings, health, or many other reasons?
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {WHY_REASONS.map((reason) => (
            <div key={reason.title} className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <reason.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground">How It Works</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Four simple steps to share and earn from your name philosophy.
        </p>
        <div className="mt-5 flex flex-col gap-5">
          {HOW_STEPS.map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </div>
                {item.step !== "04" && <div className="mt-1 h-full w-px bg-border" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground">Key Features</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {KEY_FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-3">
              <feature.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-xs font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-8 text-center">
        <div className="rounded-xl bg-primary p-6 text-primary-foreground">
          <h2 className="text-lg font-bold">Ready to Share Your Story?</h2>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Connect your wallet and start earning from your name philosophy.
          </p>
          {isConnected ? (
            <Link
              href="/write"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
            >
              Write Your Story
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={connect}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
            >
              Connect Wallet
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
