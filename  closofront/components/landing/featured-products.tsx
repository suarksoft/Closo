"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { apiGet } from "@/lib/api"

type MarketplaceProduct = {
  id: string
  title: string
  description: string
  category: string
  price: number
  commissionValue: number
}

export function FeaturedProducts() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiGet<MarketplaceProduct[]>("/products")
      .then((data) => setProducts(data))
      .catch((err) => {
        setProducts([])
        setError(err instanceof Error ? err.message : "Startup list could not be loaded.")
      })
      .finally(() => setLoading(false))
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-light text-[#222325] mb-2">
          Marketplace startup showcase
        </h2>
        <p className="text-[#74767E] mb-8">
          Live startup products listed in the marketplace, displayed in a horizontal carousel.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {loading && <p className="text-sm text-[#74767E] mb-4">Loading startup list...</p>}

        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group shrink-0 w-[260px]"
              >
                <div className="h-[220px] rounded-lg border border-[#E4E5E7] bg-[#FAFAFA] overflow-hidden">
                  <div className="p-4 h-full flex flex-col">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-[#74767E]">{product.category}</span>
                      <span className="text-xs text-[#1DBF73] font-semibold">{product.commissionValue}% commission</span>
                    </div>
                    <h3 className="text-[#222325] font-semibold text-base leading-tight mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-xs text-[#74767E] line-clamp-3 mb-4">{product.description}</p>
                    <div className="mt-auto">
                      <p className="text-sm text-[#222325] font-semibold">{product.price} MON/mo</p>
                      <p className="text-xs text-[#1DBF73] font-medium">
                        {(product.price * product.commissionValue / 100).toFixed(2)} MON/sale
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 bg-white rounded-full shadow-lg border border-[#E4E5E7] flex items-center justify-center hover:shadow-xl transition-shadow z-10"
          >
            <ChevronLeft className="h-5 w-5 text-[#222325]" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 bg-white rounded-full shadow-lg border border-[#E4E5E7] flex items-center justify-center hover:shadow-xl transition-shadow z-10"
          >
            <ChevronRight className="h-5 w-5 text-[#222325]" />
          </button>
        </div>
      </div>
    </section>
  )
}
