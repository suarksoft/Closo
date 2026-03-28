"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ExternalLink, Copy, Check, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api"

type SellerProduct = {
  id: string
  title: string
  category: string
  price: number
  commissionValue: number
  sales: number
  earnings: number
}

export default function ProductsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    apiGet<SellerProduct[]>("/products/selected/mine", true)
      .then(setProducts)
      .catch((err) => {
        setProducts([])
        setLoadError(err instanceof Error ? err.message : "Products could not be loaded.")
      })
      .finally(() => setLoading(false))
  }, [])

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`https://closo.sales/ref/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            My Products
          </h1>
          <p className="text-[#95979D]">
            Products you&apos;re currently selling
          </p>
        </div>
        <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium gap-2" asChild>
          <Link href="/marketplace">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-lg border border-[#404145] bg-[#222325] p-3 text-sm text-[#95979D]">
          Loading products...
        </div>
      )}

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-[#222325] rounded-xl border border-[#404145] overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-2 h-2 sm:h-auto bg-gradient-to-br from-emerald-800 to-emerald-900" />
              
              <div className="flex-1 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">
                        {product.title.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{product.title}</h3>
                        <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0 text-xs">
                          {product.commissionValue}%
                        </Badge>
                      </div>
                      <p className="text-sm text-[#95979D]">
                        {product.price} MON/mo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{product.sales}</p>
                      <p className="text-xs text-[#95979D]">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#1DBF73]">{product.earnings.toFixed(2)} MON</p>
                      <p className="text-xs text-[#95979D]">Earned</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-[#404145] text-[#95979D] hover:text-white hover:bg-[#2B2C2E] hover:border-[#404145]"
                        onClick={() => copyLink(product.id)}
                      >
                        {copiedId === product.id ? (
                          <Check className="h-3.5 w-3.5 text-[#1DBF73]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedId === product.id ? "Copied" : "Copy Link"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5 border-[#404145] text-[#95979D] hover:text-white hover:bg-[#2B2C2E] hover:border-[#404145]" 
                        asChild
                      >
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Sparkles className="h-3.5 w-3.5" />
                          Open Sales Workspace
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-[#404145] text-[#95979D] hover:text-white hover:bg-[#2B2C2E] hover:border-[#404145]"
                        asChild
                      >
                        <Link href={`/product/${product.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && products.length === 0 && (
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-12 text-center">
          <p className="text-[#95979D] mb-4">You haven&apos;t added any products yet</p>
          <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white" asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
