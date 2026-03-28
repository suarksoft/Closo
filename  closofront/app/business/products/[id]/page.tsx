"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiGet, apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

type Product = {
  id: string
  title: string
  description: string
  category: string
  price: number
  commissionValue: number
}

export default function EditBusinessProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiGet<Product>(`/products/${id}`)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Product could not be loaded"))
      .finally(() => setLoading(false))
  }, [id])

  const saveAsNewVersion = async () => {
    if (!product) return
    setSaving(true)
    setError(null)
    try {
      await apiPost(
        "/products",
        {
          title: product.title,
          description: product.description,
          category: product.category,
          price: Number(product.price),
          commissionValue: Number(product.commissionValue),
        },
        true,
      )
      router.push("/business/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Link href="/business/products" className="inline-flex items-center gap-2 text-[#95979D] hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>
      <h1 className="text-2xl font-bold text-white mb-2">Edit Product</h1>
      <p className="text-[#95979D] mb-8">MVP mode: edit saves as a new product version.</p>

      {loading && <p className="text-[#95979D]">Loading product...</p>}
      {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      {product && (
        <div className="space-y-4 rounded-xl border border-[#404145] bg-[#222325] p-6">
          <div className="space-y-2">
            <Label className="text-white">Title</Label>
            <Input
              value={product.title}
              onChange={(e) => setProduct({ ...product, title: e.target.value })}
              className="bg-[#1A1B1D] border-[#404145] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <Input
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="bg-[#1A1B1D] border-[#404145] text-white"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Price</Label>
              <Input
                type="number"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                className="bg-[#1A1B1D] border-[#404145] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Commission (%)</Label>
              <Input
                type="number"
                value={product.commissionValue}
                onChange={(e) => setProduct({ ...product, commissionValue: Number(e.target.value) })}
                className="bg-[#1A1B1D] border-[#404145] text-white"
              />
            </div>
          </div>
          <Button
            onClick={saveAsNewVersion}
            disabled={saving}
            className="bg-[#1DBF73] hover:bg-[#19A463] text-white"
          >
            {saving ? "Saving..." : "Save as New Version"}
          </Button>
        </div>
      )}
    </div>
  )
}
