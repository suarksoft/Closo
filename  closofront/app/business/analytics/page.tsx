"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users } from "lucide-react"
import { apiGet } from "@/lib/api"
import { useEffect, useState } from "react"

type BusinessStats = { revenue: number; salesCount: number; activeSellers: number }

export default function BusinessAnalyticsPage() {
  const [stats, setStats] = useState<BusinessStats>({ revenue: 0, salesCount: 0, activeSellers: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<{ stats: BusinessStats }>("/dashboard/business", true)
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err instanceof Error ? err.message : "Analytics could not be loaded"))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Analytics</h1>
      <p className="text-[#95979D] mb-8">Key performance metrics for your business account.</p>
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-[#222325] border-[#404145]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#1DBF73]" /> Revenue (MON)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{stats.revenue.toFixed(2)} MON</p>
            <Badge className="mt-2 bg-[#1DBF73]/10 text-[#1DBF73] border-0">Live</Badge>
          </CardContent>
        </Card>
        <Card className="bg-[#222325] border-[#404145]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#446EE7]" /> Sales</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.salesCount}</p></CardContent>
        </Card>
        <Card className="bg-[#222325] border-[#404145]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Users className="h-4 w-4 text-[#FFC107]" /> Active Sellers</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{stats.activeSellers}</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
