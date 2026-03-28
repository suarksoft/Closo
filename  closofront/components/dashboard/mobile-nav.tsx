"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Link2, 
  Wallet, 
  User
} from "lucide-react"

const navItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { label: "Links", href: "/dashboard/links", icon: Link2 },
  { label: "Earnings", href: "/dashboard/earnings", icon: Wallet },
  { label: "Profile", href: "/dashboard/settings", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1B1D] border-t border-[#404145]">
      <div className="flex items-center justify-around py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                isActive ? "text-[#1DBF73]" : "text-[#95979D]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
