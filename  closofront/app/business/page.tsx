"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Clock3,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPost } from "@/lib/api"
import { Input } from "@/components/ui/input"

type BusinessStats = { revenue: number; salesCount: number; activeSellers: number }
type Product = {
  id: string
  title: string
  price: number
  commissionValue: number
  salesCount: number
  verifiedCount: number
  pendingCount: number
  grossRevenue: number
}
type Seller = { id: string; name: string; salesCount: number; sellerEarnings: number }
type Profile = {
  id: string
  name: string
  email: string
  companyName: string | null
  walletAddress: string | null
  status: string
  createdAt: string
}
type VerificationQueueItem = {
  id: string
  productId: string
  productTitle: string
  sellerId: string
  sellerName: string
  grossAmount: number
  externalReference?: string
  referralCode?: string
  createdAt: string
}
type RecentSale = {
  id: string
  productId: string
  productTitle: string
  sellerId: string
  sellerName: string
  grossAmount: number
  status: string
  externalReference?: string
  referralCode?: string
  verificationMethod?: string
  verificationReference?: string
  verifiedAt?: string
  createdAt: string
}
type BusinessDashboardResponse = {
  profile: Profile | null
  stats: BusinessStats & {
    verifiedSales: number
    pendingSales: number
    commissionsPaid: number
    verificationRate: number
  }
  products: Product[]
  sellers: Seller[]
  verificationQueue: VerificationQueueItem[]
  recentSales: RecentSale[]
}

export default function BusinessDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<BusinessDashboardResponse["stats"]>({
    revenue: 0,
    salesCount: 0,
    activeSellers: 0,
    verifiedSales: 0,
    pendingSales: 0,
    commissionsPaid: 0,
    verificationRate: 0,
  })
  const [products, setProducts] = useState<Product[]>([])
  const [topSellers, setTopSellers] = useState<Seller[]>([])
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItem[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState("")
  const [referralAmount, setReferralAmount] = useState("")
  const [verificationMethod, setVerificationMethod] = useState("manual_review")
  const [verificationReference, setVerificationReference] = useState("")
  const [verificationNote, setVerificationNote] = useState("")
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isVerifyingReferral, setIsVerifyingReferral] = useState(false)
  const [verifyingSaleId, setVerifyingSaleId] = useState<string | null>(null)

  const loadBusinessDashboard = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await apiGet<BusinessDashboardResponse>("/dashboard/business", true)
      setProfile(data.profile)
      setStats(data.stats)
      setProducts(data.products)
      setTopSellers(data.sellers)
      setVerificationQueue(data.verificationQueue)
      setRecentSales(data.recentSales)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Business dashboard could not be loaded.")
      setProfile(null)
      setProducts([])
      setTopSellers([])
      setVerificationQueue([])
      setRecentSales([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBusinessDashboard().catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verifyReferralSale = async () => {
    setVerifyMessage(null)
    const amount = Number(referralAmount)
    if (!referralCode || !amount || amount <= 0) {
      setVerifyMessage("Referral code ve tutar zorunlu.")
      return
    }
    setIsVerifyingReferral(true)
    const result = await apiPost<{ saleId: string; referralCode: string }>(
      "/sales/by-referral",
      {
        referralCode,
        amount,
        verificationMethod,
        verificationReference: verificationReference || undefined,
        verificationNote: verificationNote || undefined,
        triggerPayout: true,
      },
      true,
    ).catch((err) => {
      setVerifyMessage(err instanceof Error ? err.message : "Dogrulama basarisiz.")
      return null
    })
    setIsVerifyingReferral(false)
    if (!result) return
    setVerifyMessage(`Satis dogrulandi. Sale ID: ${result.saleId} | Referral: ${result.referralCode}`)
    setReferralCode("")
    setReferralAmount("")
    setVerificationReference("")
    setVerificationNote("")
    await loadBusinessDashboard()
  }

  const verifyQueuedSale = async (saleId: string) => {
    setVerifyMessage(null)
    setVerifyingSaleId(saleId)
    const result = await apiPost<{ saleId: string }>(
      "/sales/verify",
      {
        saleId,
        verificationMethod,
        verificationReference: verificationReference || undefined,
        verificationNote: verificationNote || undefined,
        triggerPayout: true,
      },
      true,
    ).catch((err) => {
      setVerifyMessage(err instanceof Error ? err.message : "Queued sale verification failed.")
      return null
    })
    setVerifyingSaleId(null)
    if (!result) return
    setVerifyMessage(`Queued sale verified: ${result.saleId}`)
    setVerificationReference("")
    setVerificationNote("")
    await loadBusinessDashboard()
  }

  const salesData = useMemo(
    () => [
      { month: "Jan", revenue: Math.round(stats.revenue * 0.2) },
      { month: "Feb", revenue: Math.round(stats.revenue * 0.35) },
      { month: "Mar", revenue: Math.round(stats.revenue * 0.55) },
      { month: "Apr", revenue: Math.round(stats.revenue * 0.7) },
      { month: "May", revenue: Math.round(stats.revenue * 0.85) },
      { month: "Jun", revenue: Math.round(stats.revenue) },
    ],
    [stats.revenue],
  )

  const profileWarnings = useMemo(() => {
    const warnings: string[] = []
    if (!profile?.companyName) warnings.push("Company name eksik.")
    if (!profile?.walletAddress) warnings.push("Payout wallet adresi tanımlı değil.")
    return warnings
  }, [profile])

  const avgTicket = useMemo(() => {
    if (!stats.salesCount) return 0
    return stats.revenue / stats.salesCount
  }, [stats.revenue, stats.salesCount])

  const refreshDashboard = async () => {
    setIsRefreshing(true)
    await loadBusinessDashboard()
    setIsRefreshing(false)
  }

  const statusBadgeClass = (status: string) => {
    if (status === "verified") return "bg-[#1DBF73]/10 text-[#1DBF73] border-0"
    if (status === "pending") return "bg-[#FFC107]/10 text-[#FFC107] border-0"
    return "bg-[#404145] text-[#D1D5DB] border-0"
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#1A1B1D] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Startup Operations Dashboard
          </h1>
          <p className="text-[#95979D]">
            Product pipeline, seller network, verification queue and payout health in one panel.
          </p>
          {profile && (
            <p className="text-xs text-[#95979D] mt-2">
              {profile.companyName ?? profile.name} | {profile.email} | Wallet: {profile.walletAddress ?? "not set"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-[#404145] text-white hover:bg-[#2B2C2E] bg-[#222325]"
            onClick={refreshDashboard}
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium gap-2" asChild>
            <Link href="/business/products/new">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>
      {!!profileWarnings.length && (
        <div className="mb-6 rounded-lg border border-[#FFC107]/40 bg-[#FFC107]/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#FFC107] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#FFD666]">Profile completion required</p>
              <p className="text-xs text-[#E9E9E9] mt-1">{profileWarnings.join(" ")}</p>
              <Button size="sm" className="mt-3 bg-[#1A1B1D] text-white hover:bg-[#2B2C2E]" asChild>
                <Link href="/business/settings">Go to settings</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="mb-6 rounded-lg border border-[#404145] bg-[#222325] p-3 text-sm text-[#95979D]">
          Loading business dashboard...
        </div>
      )}
      {loadError && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {loadError}
        </div>
      )}
      <div className="mb-8 rounded-xl border border-[#404145] bg-[#222325] p-4">
        <h2 className="text-white font-semibold mb-2">Referral ile satis dogrula</h2>
        <p className="text-xs text-[#95979D] mb-3">
          Seller&apos;ın paylaştığı referral code ile satış doğrulanır ve komisyon/payout tetiklenir.
        </p>
        <div className="grid sm:grid-cols-5 gap-2">
          <Input
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Referral code (clo_xxxx)"
            className="bg-[#1A1B1D] border-[#404145] text-white"
          />
          <Input
            value={referralAmount}
            onChange={(e) => setReferralAmount(e.target.value)}
            placeholder="Sale amount"
            type="number"
            className="bg-[#1A1B1D] border-[#404145] text-white"
          />
          <Input
            value={verificationMethod}
            onChange={(e) => setVerificationMethod(e.target.value)}
            placeholder="verification method"
            className="bg-[#1A1B1D] border-[#404145] text-white"
          />
          <Input
            value={verificationReference}
            onChange={(e) => setVerificationReference(e.target.value)}
            placeholder="verification reference"
            className="bg-[#1A1B1D] border-[#404145] text-white"
          />
          <Button
            className="bg-[#1DBF73] hover:bg-[#19A463] text-white"
            onClick={verifyReferralSale}
            disabled={isVerifyingReferral}
          >
            {isVerifyingReferral ? "Verifying..." : "Verify Referral Sale"}
          </Button>
        </div>
        <Input
          value={verificationNote}
          onChange={(e) => setVerificationNote(e.target.value)}
          placeholder="verification note (optional)"
          className="mt-2 bg-[#1A1B1D] border-[#404145] text-white"
        />
        {verifyMessage && <p className="text-xs text-[#95979D] mt-2">{verifyMessage}</p>}
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#1DBF73]/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-[#1DBF73]" />
            </div>
            <Badge className="text-xs bg-[#1DBF73]/10 text-[#1DBF73] border-0 gap-1">
              <ArrowUpRight className="h-3 w-3" />
              {stats.verificationRate.toFixed(1)}%
            </Badge>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Total Revenue (MON)</p>
          <p className="text-2xl font-bold text-white">{stats.revenue.toFixed(2)} MON</p>
        </div>

        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#446EE7]/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-[#446EE7]" />
            </div>
            <Badge className="text-xs bg-[#446EE7]/10 text-[#446EE7] border-0 gap-1">
              <ArrowUpRight className="h-3 w-3" />
              {products.length} products
            </Badge>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Active Sellers</p>
          <p className="text-2xl font-bold text-white">{stats.activeSellers}</p>
        </div>

        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#1DBF73]/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-[#1DBF73]" />
            </div>
            <Badge className="text-xs bg-[#1DBF73]/10 text-[#1DBF73] border-0 gap-1">
              <ArrowUpRight className="h-3 w-3" />
              {stats.pendingSales} pending
            </Badge>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-white">{stats.salesCount}</p>
        </div>

        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#FFC107]/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-[#FFC107]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Commissions Paid (MON)</p>
          <p className="text-2xl font-bold text-white">{stats.commissionsPaid.toFixed(2)} MON</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-4">
          <p className="text-xs text-[#95979D]">Verified Sales</p>
          <p className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1DBF73]" />
            {stats.verifiedSales}
          </p>
        </div>
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-4">
          <p className="text-xs text-[#95979D]">Pending Verifications</p>
          <p className="text-xl font-bold text-white flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-[#FFC107]" />
            {stats.pendingSales}
          </p>
        </div>
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-4">
          <p className="text-xs text-[#95979D]">Verification Rate</p>
          <p className="text-xl font-bold text-white">{stats.verificationRate.toFixed(2)}%</p>
        </div>
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-4">
          <p className="text-xs text-[#95979D]">Average Ticket</p>
          <p className="text-xl font-bold text-white">{avgTicket.toFixed(2)} MON</p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button variant="outline" className="border-[#404145] bg-[#222325] text-white hover:bg-[#2B2C2E]" asChild>
          <Link href="/business/products">Manage products</Link>
        </Button>
        <Button variant="outline" className="border-[#404145] bg-[#222325] text-white hover:bg-[#2B2C2E]" asChild>
          <Link href="/business/analytics">Open analytics</Link>
        </Button>
        <Button variant="outline" className="border-[#404145] bg-[#222325] text-white hover:bg-[#2B2C2E]" asChild>
          <Link href="/business/payouts">Review payouts</Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#222325] rounded-xl border border-[#404145] p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Revenue Overview (MON)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenueBiz" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1DBF73" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1DBF73" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#95979D', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#95979D', fontSize: 12 }}
                  tickFormatter={(value) => `${value} MON`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2B2C2E',
                    border: '1px solid #404145',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }}
                  formatter={(value: number) => [`${value} MON`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1DBF73"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenueBiz)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Top Sellers</h2>
          <div className="space-y-4">
            {topSellers.map((seller, index) => (
              <div key={seller.name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#95979D] w-5">
                  #{index + 1}
                </span>
                <div className="h-10 w-10 rounded-full bg-[#2B2C2E] flex items-center justify-center text-sm font-medium text-white">
                  {seller.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{seller.name}</p>
                  <p className="text-xs text-[#95979D]">{seller.salesCount} sales</p>
                </div>
                <span className="text-sm font-semibold text-[#1DBF73]">
                  {seller.sellerEarnings.toFixed(0)} MON
                </span>
              </div>
            ))}
            {!loading && !topSellers.length && (
              <p className="text-sm text-[#95979D]">Top sellers data is not available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#222325] rounded-xl border border-[#404145] p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Verification Queue</h2>
        <div className="space-y-3">
          {verificationQueue.map((sale) => (
            <div key={sale.id} className="rounded-lg border border-[#404145] bg-[#2B2C2E] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-white text-sm font-medium">{sale.productTitle}</p>
                <p className="text-xs text-[#95979D]">
                  Seller: {sale.sellerName} | Amount: {sale.grossAmount.toFixed(2)} MON | Referral: {sale.referralCode ?? "-"}
                </p>
                <p className="text-xs text-[#95979D]">Created: {new Date(sale.createdAt).toLocaleString()}</p>
              </div>
              <Button
                className="bg-[#1DBF73] hover:bg-[#19A463] text-white"
                onClick={() => verifyQueuedSale(sale.id)}
                disabled={verifyingSaleId === sale.id}
              >
                {verifyingSaleId === sale.id ? "Verifying..." : "Verify Sale"}
              </Button>
            </div>
          ))}
          {!loading && !verificationQueue.length && (
            <p className="text-sm text-[#95979D]">No pending sales to verify.</p>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#222325] rounded-xl border border-[#404145]">
        <div className="flex items-center justify-between p-6 border-b border-[#404145]">
          <h2 className="text-lg font-semibold text-white">Your Products</h2>
          <Button variant="ghost" size="sm" className="text-[#95979D] hover:text-white hover:bg-[#2B2C2E]" asChild>
            <Link href="/business/products">View All</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404145]">
                <th className="text-left py-4 px-6 text-sm font-medium text-[#95979D]">Product</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#95979D]">Price</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#95979D]">Commission</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#95979D]">Verification</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#95979D]">Total Sales</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-[#95979D]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[#404145]/50 hover:bg-[#2B2C2E]/50">
                  <td className="py-4 px-6">
                    <p className="font-medium text-white">{product.title}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white">{product.price} MON/mo</span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0">
                      {product.commissionValue}%
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0">
                        V: {product.verifiedCount}
                      </Badge>
                      <Badge className="bg-[#FFC107]/10 text-[#FFC107] border-0">
                        P: {product.pendingCount}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white">{product.salesCount.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-[#95979D] hover:text-white hover:bg-[#2B2C2E]" asChild>
                        <Link href={`/business/products/${product.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !products.length && (
                <tr>
                  <td className="py-6 px-6 text-center text-[#95979D]" colSpan={6}>
                    No products yet. Add your first product to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#222325] rounded-xl border border-[#404145] mt-8">
        <div className="p-6 border-b border-[#404145]">
          <h2 className="text-lg font-semibold text-white">Recent Sales Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404145]">
                <th className="text-left py-3 px-6 text-xs text-[#95979D]">Product</th>
                <th className="text-left py-3 px-6 text-xs text-[#95979D]">Seller</th>
                <th className="text-left py-3 px-6 text-xs text-[#95979D]">Amount</th>
                <th className="text-left py-3 px-6 text-xs text-[#95979D]">Status</th>
                <th className="text-left py-3 px-6 text-xs text-[#95979D]">Verification</th>
                <th className="text-left py-3 px-6 text-xs text-[#95979D]">Reference</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id} className="border-b border-[#404145]/50">
                  <td className="py-3 px-6 text-white text-sm">{sale.productTitle}</td>
                  <td className="py-3 px-6 text-white text-sm">{sale.sellerName}</td>
                  <td className="py-3 px-6 text-white text-sm">{sale.grossAmount.toFixed(2)} MON</td>
                  <td className="py-3 px-6 text-xs">
                    <Badge className={statusBadgeClass(sale.status)}>{sale.status}</Badge>
                  </td>
                  <td className="py-3 px-6 text-xs text-[#95979D]">{sale.verificationMethod ?? "-"}</td>
                  <td className="py-3 px-6 text-xs text-[#95979D]">{sale.verificationReference ?? sale.externalReference ?? "-"}</td>
                </tr>
              ))}
              {!loading && !recentSales.length && (
                <tr>
                  <td className="py-6 px-6 text-center text-[#95979D]" colSpan={6}>
                    No sales activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
