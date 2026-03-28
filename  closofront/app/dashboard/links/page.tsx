"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Copy, Check, Link as LinkIcon, MousePointer, Target } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPost } from "@/lib/api"

type ReferralLink = {
  id: string
  code: string
  productId: string
  productTitle: string
  clickCount: number
  conversionCount: number
  url: string
  createdAt: string
}

export default function LinksPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [links, setLinks] = useState<ReferralLink[]>([])
  const [productId, setProductId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<ReferralLink[]>("/referrals/mine", true).then(setLinks).catch(() => setLinks([]))
  }, [])

  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totals = useMemo(() => {
    const clicks = links.reduce((sum, item) => sum + item.clickCount, 0)
    const conversions = links.reduce((sum, item) => sum + item.conversionCount, 0)
    const avg = clicks > 0 ? (conversions / clicks) * 100 : 0
    return { clicks, conversions, avg }
  }, [links])

  const createReferral = async () => {
    if (!productId) return
    setError(null)
    const created = await apiPost<ReferralLink>("/referrals", { productId }, true).catch((err) => {
      setError(err instanceof Error ? err.message : "Link olusturulamadi")
      return null
    })
    if (!created) return
    setLinks((prev) => [created, ...prev])
    setProductId("")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Referral Links
        </h1>
        <p className="text-[#95979D]">
          Track and manage your referral links
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-[#446EE7]/10 flex items-center justify-center">
              <MousePointer className="h-5 w-5 text-[#446EE7]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Total Clicks</p>
          <p className="text-2xl font-bold text-white">{totals.clicks}</p>
        </div>
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-[#1DBF73]/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-[#1DBF73]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Total Conversions</p>
          <p className="text-2xl font-bold text-[#1DBF73]">{totals.conversions}</p>
        </div>
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-[#FFC107]/10 flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-[#FFC107]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Avg. Conversion Rate</p>
          <p className="text-2xl font-bold text-white">{totals.avg.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#404145] bg-[#222325] p-4">
        <p className="text-sm font-medium text-white mb-2">Yeni referral link olustur</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Product ID gir"
            className="bg-[#2B2C2E] border-[#404145] text-white"
          />
          <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white" onClick={createReferral}>
            Create Link
          </Button>
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <div className="grid gap-4">
        {links.map((link) => (
          <div key={link.id} className="bg-[#222325] rounded-xl border border-[#404145] p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#446EE7] to-[#1DBF73] flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{link.productTitle.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{link.productTitle}</h3>
                  <p className="text-xs text-[#95979D] mb-2">Code: {link.code}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-[#2B2C2E] px-3 py-1.5 rounded-lg border border-[#404145] text-[#95979D]">
                      {link.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-[#2B2C2E]"
                      onClick={() => copyLink(link.id, link.url)}
                    >
                      {copiedId === link.id ? (
                        <Check className="h-4 w-4 text-[#1DBF73]" />
                      ) : (
                        <Copy className="h-4 w-4 text-[#95979D]" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{link.clickCount}</p>
                  <p className="text-xs text-[#95979D]">Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1DBF73]">{link.conversionCount}</p>
                  <p className="text-xs text-[#95979D]">Conversions</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0 text-lg font-bold">
                    {link.clickCount > 0 ? ((link.conversionCount / link.clickCount) * 100).toFixed(1) : "0.0"}%
                  </Badge>
                  <p className="text-xs text-[#95979D] mt-1">CVR</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!links.length && <p className="text-sm text-[#95979D]">Henüz referral link oluşturulmamış.</p>}
      </div>
    </div>
  )
}
