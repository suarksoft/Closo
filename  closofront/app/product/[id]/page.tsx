"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiGet, apiPost } from "@/lib/api"
import { getSessionUser, type SessionUser } from "@/lib/auth"
import { ArrowLeft, Copy, Check, TrendingUp, Users, DollarSign, BarChart3, Star, Zap, Shield, Clock, Sparkles } from "lucide-react"

type Product = {
  id: string
  title: string
  description: string
  category: string
  commissionValue: number
  price: number
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [copied, setCopied] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [aiMessage, setAiMessage] = useState("")
  const [aiStrategy, setAiStrategy] = useState("")
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [addLoading, setAddLoading] = useState(false)
  const [addMessage, setAddMessage] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const resolvedParams = use(params)

  useEffect(() => {
    setSessionUser(getSessionUser())
  }, [])

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    apiGet<Product>(`/products/${resolvedParams.id}`)
      .then((data) => setProduct(data))
      .catch((err) => {
        setProduct(null)
        setLoadError(err instanceof Error ? err.message : "Product could not be loaded.")
      })
      .finally(() => setLoading(false))
  }, [resolvedParams.id])

  const referralLink = useMemo(() => {
    if (!product) return "closo.link/loading"
    const slug = product.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    return `closo.link/ref/${slug}-${product.id.slice(0, 8)}`
  }, [product])

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${referralLink}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateAiMessage = async () => {
    if (!product) return
    setAiError(null)
    setAiLoading(true)
    try {
      const output = await apiPost<{ message: string; strategy: string }>(
        "/ai/sales-message",
        {
          companyName: "Prospect Company",
          productName: product.title,
          productDescription: product.description,
          channel: "email",
        },
        true,
      )
      setAiMessage(output.message)
      setAiStrategy(output.strategy)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI message could not be generated.")
    } finally {
      setAiLoading(false)
    }
  }

  const addToDashboard = async () => {
    if (!product) return
    setAddError(null)
    setAddMessage(null)
    setAddLoading(true)
    try {
      await apiPost(`/products/${product.id}/select`, {}, true)
      setAddMessage("Urun dashboard urunlerine eklendi.")
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Urun dashboarda eklenemedi.")
    } finally {
      setAddLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <section className="pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-[#E4E5E7] p-8 text-center">
              <p className="text-[#74767E]">Loading product...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <section className="pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-[#E4E5E7] p-8 text-center">
              <p className="text-[#222325] font-medium mb-2">Product unavailable</p>
              <p className="text-[#74767E] mb-6">{loadError ?? "This product could not be found."}</p>
              <Button asChild className="bg-[#222325] hover:bg-[#404145]">
                <Link href="/marketplace">Back to Marketplace</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <section className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-[#74767E] hover:text-[#222325] transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-2xl p-8 mb-8">
                <Badge className="bg-white/20 text-white border-0 mb-4">{product.category}</Badge>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{product.title}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-[#FFB800] text-[#FFB800]" />
                    <span className="text-white font-semibold">4.8</span>
                    <span className="text-white/70">(live product)</span>
                  </div>
                  <div className="text-white/70">|</div>
                  <div className="text-white font-semibold">{product.commissionValue}% Commission</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E4E5E7] p-6 mb-6">
                <h2 className="text-lg font-semibold text-[#222325] mb-4">About this product</h2>
                <p className="text-[#74767E] leading-relaxed">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-[#E4E5E7] p-5">
                  <div className="flex items-center gap-2 text-[#74767E] mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Total Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-[#222325]">Live</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E4E5E7] p-5">
                  <div className="flex items-center gap-2 text-[#74767E] mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Conversion</span>
                  </div>
                  <p className="text-2xl font-bold text-[#222325]">N/A</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E4E5E7] p-5">
                  <div className="flex items-center gap-2 text-[#74767E] mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Avg Earnings</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1DBF73]">{((product.price * product.commissionValue) / 100).toFixed(2)} MON</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E4E5E7] p-5">
                  <div className="flex items-center gap-2 text-[#74767E] mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Price</span>
                  </div>
                  <p className="text-2xl font-bold text-[#222325]">{product.price} MON/mo</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E4E5E7] p-6 sticky top-24">
                <div className="text-center mb-6 pb-6 border-b border-[#E4E5E7]">
                  <p className="text-sm text-[#74767E] mb-2">Your Earnings Per Sale</p>
                  <p className="text-4xl font-bold text-[#1DBF73]">{((product.price * product.commissionValue) / 100).toFixed(2)} MON</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[#74767E]">Product Price</span>
                    <span className="text-[#222325] font-medium">{product.price} MON/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#74767E]">Commission Rate</span>
                    <span className="text-[#1DBF73] font-semibold">{product.commissionValue}%</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-[#74767E] mb-2">Your Referral Link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#FAFAFA] rounded-lg px-3 py-2.5 overflow-hidden border border-[#E4E5E7]">
                      <code className="text-sm text-[#74767E] truncate block">{referralLink}</code>
                    </div>
                    <Button size="sm" onClick={copyLink} className="shrink-0 bg-[#222325] hover:bg-[#404145]">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {sessionUser?.role === "seller" && (
                    <Button
                      variant="outline"
                      className="w-full h-12 gap-2 border-[#1DBF73] text-[#1DBF73] hover:bg-[#1DBF73] hover:text-white"
                      onClick={addToDashboard}
                      disabled={addLoading}
                    >
                      {addLoading ? "Ekleniyor..." : "Dashboarda Ekle"}
                    </Button>
                  )}
                  <Button className="w-full h-12 bg-[#1DBF73] hover:bg-[#19A463] text-white font-semibold" onClick={copyLink}>
                    {copied ? "Copied!" : "Get Referral Link"}
                  </Button>
                  <Button variant="outline" className="w-full h-12 gap-2 border-[#222325] text-[#222325] hover:bg-[#222325] hover:text-white" onClick={generateAiMessage}>
                    {aiLoading ? "Generating..." : "Generate AI Message"}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>

                {aiMessage && (
                  <div className="mt-4 rounded-lg border border-[#E4E5E7] bg-[#FAFAFA] p-4">
                    <p className="text-sm font-semibold text-[#222325] mb-2">AI Message</p>
                    <p className="text-sm text-[#74767E] mb-2">{aiMessage}</p>
                    <p className="text-xs text-[#74767E]">{aiStrategy}</p>
                  </div>
                )}
                {aiError && (
                  <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                    <p className="text-sm text-red-600">{aiError}</p>
                  </div>
                )}
                {addMessage && (
                  <div className="mt-4 rounded-lg border border-[#1DBF73]/30 bg-[#1DBF73]/5 p-4">
                    <p className="text-sm text-[#1DBF73]">{addMessage}</p>
                  </div>
                )}
                {addError && (
                  <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                    <p className="text-sm text-red-600">{addError}</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-[#E4E5E7]">
                  <div className="flex items-center justify-center gap-6 text-[#74767E]">
                    <div className="flex items-center gap-2 text-xs"><Shield className="h-4 w-4" /><span>Secure</span></div>
                    <div className="flex items-center gap-2 text-xs"><Zap className="h-4 w-4" /><span>Instant</span></div>
                    <div className="flex items-center gap-2 text-xs"><Clock className="h-4 w-4" /><span>24/7</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
