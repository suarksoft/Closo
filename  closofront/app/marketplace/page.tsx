"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ArrowUpDown, ArrowRight, Star, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiGet } from "@/lib/api"

const categories = [
  { name: "All", icon: "grid" },
  { name: "Productivity", icon: "zap" },
  { name: "Analytics", icon: "bar-chart" },
  { name: "Security", icon: "shield" },
  { name: "Communication", icon: "message" },
  { name: "Marketing", icon: "megaphone" },
  { name: "Development", icon: "code" },
]

type MarketplaceProduct = {
  id: string
  title: string
  description: string
  commissionValue: number
  price: number
  category: string
}

const colors = [
  "bg-gradient-to-br from-emerald-800 to-emerald-900",
  "bg-gradient-to-br from-blue-800 to-blue-900",
  "bg-gradient-to-br from-violet-800 to-violet-900",
  "bg-gradient-to-br from-cyan-800 to-cyan-900",
  "bg-gradient-to-br from-orange-700 to-orange-800",
  "bg-gradient-to-br from-pink-800 to-pink-900",
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("popular")
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoadError(null)
    apiGet<MarketplaceProduct[]>("/products")
      .then(setProducts)
      .catch((err) => {
        setProducts([])
        setLoadError(err instanceof Error ? err.message : "Products could not be loaded.")
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "commission":
          return b.commissionValue - a.commissionValue
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "popular":
        default:
          return b.price - a.price
      }
    })

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#222325] mb-4">
              Product Marketplace
            </h1>
            <p className="text-lg text-[#74767E] max-w-2xl mx-auto">
              Browse hundreds of SaaS products and start earning commissions today.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-[#E4E5E7] p-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#74767E]" />
                <Input
                  placeholder="Search products..."
                  className="pl-12 h-12 bg-[#FAFAFA] border-[#E4E5E7] text-[#222325] placeholder:text-[#74767E] focus:border-[#222325]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 h-12 border-[#E4E5E7] text-[#222325] hover:bg-[#FAFAFA]">
                      <Filter className="h-4 w-4" />
                      {selectedCategory}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-[#E4E5E7]">
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className="text-[#222325] hover:bg-[#FAFAFA]"
                      >
                        {category.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 h-12 border-[#E4E5E7] text-[#222325] hover:bg-[#FAFAFA]">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-[#E4E5E7]">
                    <DropdownMenuItem onClick={() => setSortBy("popular")} className="text-[#222325]">
                      Most Popular
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("commission")} className="text-[#222325]">
                      Highest Commission
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price-low")} className="text-[#222325]">
                      Price: Low to High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("price-high")} className="text-[#222325]">
                      Price: High to Low
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.name
                    ? "bg-[#222325] text-white"
                    : "bg-white text-[#222325] border border-[#E4E5E7] hover:border-[#222325]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loadError && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
              {loadError}
            </div>
          )}
          {loading ? (
            <div className="text-center py-16">
              <p className="text-[#74767E]">Loading products...</p>
            </div>
          ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-white rounded-xl border border-[#E4E5E7] overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Colored Header */}
                <div className={`${colors[index % colors.length]} p-6 h-32 flex items-end`}>
                  <h3 className="text-xl font-bold text-white">
                    {product.title}
                  </h3>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="text-xs bg-[#FAFAFA] text-[#74767E] border-0 font-normal">
                      {product.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-[#FFB800] text-[#FFB800]" />
                      <span className="text-[#222325] font-medium">4.8</span>
                    </div>
                  </div>

                  <p className="text-sm text-[#74767E] mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[#222325] font-semibold">{product.price} MON</span>
                      <span className="text-[#74767E] text-sm">/mo</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-[#74767E]">
                      <Users className="h-3.5 w-3.5" />
                      Live product
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E4E5E7]">
                    <div className="text-sm">
                      <span className="text-[#74767E]">Earn </span>
                      <span className="text-[#1DBF73] font-semibold">
                        {((product.price * product.commissionValue) / 100).toFixed(2)} MON/sale
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-[#1DBF73] font-bold">{product.commissionValue}%</span>
                      <span className="text-[#74767E]">commission</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#74767E]">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
