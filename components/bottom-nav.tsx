"use client"

// Bottom navigation component for the mobile-first experience.
// Provides quick access to the main app sections: Home, Write, Pair, Explore, and About.
// Uses Next.js Link for client-side navigation and usePathname to detect the active route.
// Icons are from lucide-react for a consistent and modern UI.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PenSquare, Compass, BookOpen, Users } from "lucide-react" // Added Users icon for the Pair feature
import { cn } from "@/lib/utils"

// NAV_ITEMS array defines all navigation links.
// Order in the array determines the left-to-right order in the bottom nav.
// Each item contains: route (href), display label, and the Lucide icon component.
// "Pair" was added here to support the new /pair page (e.g., user matching, story pairing, etc.).

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/write", label: "Write", icon: PenSquare },
  { href: "/pair", label: "Pair", icon: Users }, // New: Pair feature for connecting users/stories/prompts
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/about", label: "About", icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      {/* Main container - centered with max width for tablet/desktop compatibility */}
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Icon gets thicker stroke when active for better visual feedback */}
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}