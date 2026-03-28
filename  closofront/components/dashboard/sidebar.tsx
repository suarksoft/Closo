"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { getSessionUser, signOut } from "@/lib/auth"
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Link2, 
  Wallet, 
  Settings,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Products", href: "/dashboard/products", icon: ShoppingBag },
  { label: "Referral Links", href: "/dashboard/links", icon: Link2 },
  { label: "Earnings", href: "/dashboard/earnings", icon: Wallet },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [displayName, setDisplayName] = useState("Seller")
  const [badgeText, setBadgeText] = useState("Seller")

  useEffect(() => {
    const user = getSessionUser()
    if (!user) return
    setDisplayName(user.name || "Seller")
    setBadgeText(user.role === "business" ? "Business" : user.role === "admin" ? "Admin" : "Seller")
  }, [])

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SL"

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#1A1B1D] border-r border-[#404145]">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold text-white">closo</span>
          <span className="text-[#1DBF73] text-xl">.</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-[#1DBF73]/10 text-[#1DBF73]"
                  : "text-[#95979D] hover:bg-[#2B2C2E] hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#404145]">
        <div className="bg-[#2B2C2E] rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-[#1DBF73] flex items-center justify-center">
              <span className="text-sm font-bold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-[#95979D]">{badgeText}</p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-[#95979D] hover:text-white hover:bg-[#2B2C2E]"
          onClick={() => {
            signOut()
            router.push("/")
          }}
        >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
        </Button>
      </div>
    </aside>
  )
}
