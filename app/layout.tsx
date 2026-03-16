import React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import { WalletProvider } from "@/lib/wallet-context"
import { StoriesProvider } from "@/lib/stories-context"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { FarcasterReady } from "@/components/farcaster-ready"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Names - Philosophy Behind Your Username",
  description:
    "Share the charismatic philosophy behind your username. Earn USDC when others value your story on Base.",

  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },

  openGraph: {
    title: "Names — Philosophy Behind Your Username",
    description:
      "Discover the stories behind usernames. Send appreciation with gasless USDC on Base.",
    url: "https://names-app-seven.vercel.app",
    siteName: "Names",
    images: [
      {
        url: "https://names-app-seven.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Names App",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Names — Philosophy Behind Your Username",
    description: "Discover the stories behind usernames on Base.",
    images: ["https://names-app-seven.vercel.app/og-image.png"],
  },

  other: {
    "base:builder-code": "bc_rapdmhv2",
    // ✅ Format Mini App embed baru — dikenali oleh Farcaster Embed Tool
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://names-app-seven.vercel.app/og-image.png",
      button: {
        title: "Open Names",
        action: {
          type: "launch_frame",
          name: "Names",
          url: "https://names-app-seven.vercel.app",
          splashImageUrl: "https://names-app-seven.vercel.app/og-image.png",
          splashBackgroundColor: "#1a6b3c",
        },
      },
    }),
  },
}

export const viewport: Viewport = {
  themeColor: "#1a6b3c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="694f1d014d3a403912ed8179" />
      </head>
      <body className="font-sans antialiased">
        {/* ✅ Dismiss Farcaster splash screen as soon as app mounts */}
        <FarcasterReady />
        <ErrorBoundary>
          <Providers>
            <WalletProvider>
              <StoriesProvider>
                <AppHeader />
                <main className="pb-20">{children}</main>
                <BottomNav />
              </StoriesProvider>
            </WalletProvider>
          </Providers>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}