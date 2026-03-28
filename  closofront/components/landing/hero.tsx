"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section className="bg-[#222325] relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#222325] via-[#222325]/95 to-[#222325]/80" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
            <span className="block font-light">List your product,</span>
            <span className="block font-light italic">sell faster with AI</span>
          </h1>
          <p className="text-[#D1D5DB] text-base sm:text-lg mb-8 max-w-xl">
            Closo moves marketplace products into your seller dashboard and accelerates conversions with
            product-specific scripts, prospect lists, sequences, and ready-to-send messaging packages.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-[#1DBF73] hover:bg-[#19A463] text-white h-11 px-6">
              <Link href="/marketplace">
                Explore Marketplace
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 px-6 bg-transparent border-white/40 text-white hover:bg-white hover:text-[#222325]"
            >
              <Link href="/dashboard/products">
                <Sparkles className="h-4 w-4 mr-2" />
                Sales Workspace
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-[#9CA3AF]">
            <ArrowRight className="h-4 w-4" />
            Marketplace products are displayed below in a live horizontal carousel.
          </div>
        </div>
      </div>
    </section>
  )
}
