import React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import { WalletProvider } from "@/lib/wallet-context"
import { StoriesProvider } from "@/lib/stories-context"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import "@coinbase/onchainkit/styles.css"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Names - The Philosophy Behind Your Username",
  description:
    "Share the charismatic philosophy behind your username. Earn USDC when others value your story on Base.",
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a6b3c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <WalletProvider>
            <StoriesProvider>
              <AppHeader />
              <main className="pb-20">{children}</main>
              <BottomNav />
            </StoriesProvider>
          </WalletProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}