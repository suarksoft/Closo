"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, Globe, Menu, X, Search } from "lucide-react"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSessionUser, signOut, type SessionUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface HeaderProps {
  variant?: "light" | "dark"
  showSearch?: boolean
}

export function Header({ variant = "dark", showSearch = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const router = useRouter()
  
  const isDark = variant === "dark"
  const bgClass = isDark ? "bg-[#222325] border-[#404145]" : "bg-white border-[#E4E5E7]"
  const textClass = isDark ? "text-white" : "text-[#222325]"
  const mutedClass = isDark ? "text-gray-300" : "text-[#74767E]"

  useEffect(() => {
    setSessionUser(getSessionUser())
  }, [])

  const dashboardHref = sessionUser?.role === "business" ? "/business" : "/dashboard"
  const joinLabel = sessionUser ? sessionUser.name : "Join"

  return (
    <header className={`${bgClass} border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className={`text-2xl font-bold ${textClass}`}>closo</span>
            <span className="text-[#1DBF73] text-2xl">.</span>
          </Link>

          {/* Search Bar - Only on light variant */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="What service are you looking for today?"
                  className="w-full h-10 pl-4 pr-12 rounded-md border border-[#E4E5E7] text-sm text-[#222325] placeholder:text-[#74767E] focus:outline-none focus:border-[#222325]"
                />
                <button className="absolute right-0 top-0 h-10 w-10 bg-[#222325] rounded-r-md flex items-center justify-center hover:bg-[#404145] transition-colors">
                  <Search className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`${textClass} hover:bg-transparent hover:opacity-80 gap-1 text-sm font-normal px-3`}>
                  Closo Pro
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>For Sellers</DropdownMenuItem>
                <DropdownMenuItem>For Businesses</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`${textClass} hover:bg-transparent hover:opacity-80 gap-1 text-sm font-normal px-3`}>
                  Explore
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/marketplace">Browse Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Categories</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" className={`${mutedClass} hover:bg-transparent hover:opacity-80 gap-1 text-sm font-normal px-3`}>
              <Globe className="h-4 w-4" />
              EN
            </Button>

            <Link href="/business">
              <Button variant="ghost" className={`${textClass} hover:bg-transparent hover:opacity-80 text-sm font-normal px-3`}>
                Become a Seller
              </Button>
            </Link>

            {sessionUser ? (
              <Button variant="ghost" className={`${textClass} hover:bg-transparent hover:opacity-80 text-sm font-normal px-3`} asChild>
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
            ) : (
              <Button variant="ghost" className={`${textClass} hover:bg-transparent hover:opacity-80 text-sm font-normal px-3`} asChild>
                <Link href="/dashboard">Sign in</Link>
              </Button>
            )}

            {sessionUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`ml-2 rounded-md text-sm font-medium ${isDark ? "border-white text-black hover:bg-white hover:text-[#222325]" : "border-[#222325] text-[#222325] hover:bg-[#222325] hover:text-white"}`}
                  >
                    {joinLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref}>Go to dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace">Marketplace</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      signOut()
                      setSessionUser(null)
                      router.push("/")
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/onboarding">
                <Button
                  variant="outline"
                  className={`ml-2 rounded-md text-sm font-medium ${isDark ? "border-white text-black hover:bg-white hover:text-[#222325]" : "border-[#222325] text-[#222325] hover:bg-[#222325] hover:text-white"}`}
                >
                  {joinLabel}
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden ${textClass}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden py-4 border-t ${isDark ? 'border-[#404145]' : 'border-[#E4E5E7]'}`}>
            <nav className="flex flex-col gap-2">
              <Link href="/marketplace" className={`px-4 py-2 ${textClass} hover:opacity-80`}>
                Explore Products
              </Link>
              <Link href="/business" className={`px-4 py-2 ${textClass} hover:opacity-80`}>
                Become a Seller
              </Link>
              <Link href={dashboardHref} className={`px-4 py-2 ${textClass} hover:opacity-80`}>
                {sessionUser ? "Dashboard" : "Sign in"}
              </Link>
              {sessionUser ? (
                <>
                  <Link href="/marketplace" className={`px-4 py-2 ${textClass} hover:opacity-80`}>
                    Marketplace
                  </Link>
                  <div className="px-4 py-2">
                    <Button
                      className="w-full bg-[#222325] hover:bg-[#404145] text-white"
                      onClick={() => {
                        signOut()
                        setSessionUser(null)
                        router.push("/")
                      }}
                    >
                      Sign out ({sessionUser.name})
                    </Button>
                  </div>
                </>
              ) : (
                <Link href="/onboarding" className="px-4 py-2">
                  <Button className="w-full bg-[#1DBF73] hover:bg-[#19A463] text-white">
                    Join
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
