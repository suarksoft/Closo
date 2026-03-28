"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiGet } from "@/lib/api"

type Product = {
  id: string
  title: string
  category: string
  price: number
  commissionValue: number
  isActive: boolean
}

export default function BusinessProductsPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    apiGet<Product[]>("/products/mine", true).then(setProducts).catch(() => setProducts([]))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Products</h1>
          <p className="text-[#95979D]">Manage listed products and commission settings.</p>
        </div>
        <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white" asChild>
          <Link href="/business/products/new">Add Product</Link>
        </Button>
      </div>

      <div className="bg-[#222325] rounded-xl border border-[#404145] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#404145]">
              <th className="text-left p-4 text-[#95979D]">Product</th>
              <th className="text-left p-4 text-[#95979D]">Category</th>
              <th className="text-left p-4 text-[#95979D]">Price</th>
              <th className="text-left p-4 text-[#95979D]">Commission</th>
              <th className="text-left p-4 text-[#95979D]">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-[#404145]/50">
                <td className="p-4 text-white">{product.title}</td>
                <td className="p-4 text-white">{product.category}</td>
                <td className="p-4 text-white">{product.price} MON/mo</td>
                <td className="p-4 text-white">{product.commissionValue}%</td>
                <td className="p-4">
                  <Badge className={product.isActive ? "bg-[#1DBF73]/10 text-[#1DBF73] border-0" : "bg-[#FFC107]/10 text-[#FFC107] border-0"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
