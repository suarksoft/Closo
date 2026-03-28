"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth"
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Wallet, 
  Settings,
  LogOut,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "Overview", href: "/business", icon: LayoutDashboard },
  { label: "My Products", href: "/business/products", icon: Package },
  { label: "Analytics", href: "/business/analytics", icon: BarChart3 },
  { label: "Payouts", href: "/business/payouts", icon: Wallet },
  { label: "Settings", href: "/business/settings", icon: Settings },
]

export function BusinessSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#1A1B1D] border-r border-[#404145]">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#222325] flex items-center justify-center">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <span className="text-lg font-bold text-white">Closo</span>
        </Link>
        <p className="text-xs text-[#95979D] mt-1 ml-12">Business Portal</p>
      </div>

      <div className="px-4 mb-4">
        <Button className="w-full gap-2 h-11 bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium" asChild>
          <Link href="/business/products/new">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/business" && pathname.startsWith(`${item.href}/`))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-[#1DBF73]/10 text-[#1DBF73]"
                  : "text-[#95979D] hover:bg-[#222325] hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#404145]">
        <div className="bg-[#222325] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1DBF73]/10 flex items-center justify-center">
              <span className="text-sm font-bold text-[#1DBF73]">CL</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Closo</p>
              <p className="text-xs text-[#95979D]">Business Account</p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-[#95979D] hover:text-white hover:bg-[#222325]"
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
