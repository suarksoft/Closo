"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { apiGet } from "@/lib/api"
import { getSessionUser } from "@/lib/auth"

type DashboardStats = {
  totalEarnings: number
  pendingEarnings: number
  salesCount: number
  leadCount: number
}

type DashboardSellerResponse = {
  stats: DashboardStats
  payouts: Array<{
    id: string
    amount: number
    status: string
    txHash?: string
    paidAt?: string
  }>
}

export default function EarningsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    salesCount: 0,
    leadCount: 0,
  })
  const [payouts, setPayouts] = useState<DashboardSellerResponse["payouts"]>([])
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    const sessionUser = getSessionUser()
    setWalletAddress(sessionUser?.walletAddress ?? null)

    setLoading(true)
    setError(null)
    apiGet<DashboardSellerResponse>("/dashboard/seller", true)
      .then((data) => {
        setStats(data.stats)
        setPayouts(data.payouts ?? [])
      })
      .catch((err) => {
        setStats({
          totalEarnings: 0,
          pendingEarnings: 0,
          salesCount: 0,
          leadCount: 0,
        })
        setPayouts([])
        setError(err instanceof Error ? err.message : "Earnings data could not be loaded.")
      })
      .finally(() => setLoading(false))
  }, [])

  const earningsData = useMemo(
    () => [
      { month: "Jan", earnings: Math.round(stats.totalEarnings * 0.2) },
      { month: "Feb", earnings: Math.round(stats.totalEarnings * 0.35) },
      { month: "Mar", earnings: Math.round(stats.totalEarnings * 0.55) },
      { month: "Apr", earnings: Math.round(stats.totalEarnings * 0.7) },
      { month: "May", earnings: Math.round(stats.totalEarnings * 0.85) },
      { month: "Jun", earnings: Math.round(stats.totalEarnings) },
    ],
    [stats.totalEarnings],
  )

  const paidOut = useMemo(
    () =>
      payouts
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
    [payouts],
  )

  const thisMonth = useMemo(() => {
    const now = new Date()
    return payouts
      .filter((p) => p.paidAt)
      .filter((p) => {
        const d = new Date(p.paidAt as string)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
  }, [payouts])

  const shortWallet = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not connected"

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Earnings
          </h1>
          <p className="text-[#95979D]">
            Track your commissions and payouts
          </p>
        </div>
        <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium gap-2" disabled>
          <Wallet className="h-4 w-4" />
          Wallet: {shortWallet}
        </Button>
      </div>
      {loading && (
        <div className="mb-6 rounded-lg border border-[#404145] bg-[#222325] p-3 text-sm text-[#95979D]">
          Loading earnings...
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#1DBF73]/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-[#1DBF73]" />
            </div>
            <Badge className="text-xs gap-1 bg-[#1DBF73]/10 text-[#1DBF73] border-0">
              <ArrowUpRight className="h-3 w-3" />
              12%
            </Badge>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Total Earnings (MON)</p>
          <p className="text-2xl font-bold text-[#1DBF73]">{stats.totalEarnings.toFixed(2)} MON</p>
        </div>

        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#FFC107]/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-[#FFC107]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Pending</p>
          <p className="text-2xl font-bold text-white">{stats.pendingEarnings.toFixed(2)} MON</p>
        </div>

        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#446EE7]/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-[#446EE7]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Paid Out</p>
          <p className="text-2xl font-bold text-white">{paidOut.toFixed(2)} MON</p>
        </div>

        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#1DBF73]/10 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-[#1DBF73]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">This Month</p>
          <p className="text-2xl font-bold text-white">{thisMonth.toFixed(2)} MON</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Earnings Over Time (MON)</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorEarningsPage" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value: number) => [`${value} MON`, 'Earnings']}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#1DBF73"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEarningsPage)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#222325] rounded-xl border border-[#404145] p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Transactions</h2>
          <div className="space-y-3">
            {payouts.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-[#2B2C2E]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#446EE7]/10">
                    <Wallet className="h-5 w-5 text-[#446EE7]" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      Payout
                    </p>
                    <p className="text-xs text-[#95979D]">{tx.paidAt ? new Date(tx.paidAt).toLocaleString() : "-"}</p>
                    <p className="text-xs text-[#95979D]">{tx.txHash ? `${tx.txHash.slice(0, 10)}...` : "Pending tx"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">
                    -{Number(tx.amount).toFixed(2)} MON
                  </p>
                  <Badge className={`text-xs border-0 ${
                    tx.status === "paid"
                      ? "bg-[#1DBF73]/10 text-[#1DBF73]" 
                      : "bg-[#FFC107]/10 text-[#FFC107]"
                  }`}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
            {!loading && !payouts.length && (
              <div className="rounded-xl border border-[#404145] bg-[#2B2C2E] p-4 text-sm text-[#95979D]">
                No payout transactions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
