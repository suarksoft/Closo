"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Wallet, TrendingUp, Clock, Copy, Sparkles, ArrowUpRight, MapPin, Building2, MessageSquare, Mail, Check, Zap, Target, Send } from "lucide-react"
import { LeadDetailModal } from "@/components/dashboard/lead-detail-modal"
import { apiGet, apiPost } from "@/lib/api"
import { getSessionUser } from "@/lib/auth"

type DashboardStats = {
  totalEarnings: number
  pendingEarnings: number
  salesCount: number
  leadCount: number
}

type MyLead = {
  id: string
  leadId: string
  companyName: string
  contactChannel: "email" | "whatsapp" | "instagram"
  location: string
  score: number
  productId: string
}

type CreditsState = {
  balance: number
  creditsPerMon: number
}

type ToolItem = {
  toolKey: string
  displayName: string
  creditCost: number
}

type WorkspaceMetrics = {
  workspaceCount: number
  prospectCount: number
  assetCount: number
  sequenceStepCount: number
  totalRuns: number
  totalCreditsSpent: number
  verifiedSales: number
  creditsPerVerifiedSale: number | null
}

export default function DashboardPage() {
  const [selectedLead, setSelectedLead] = useState<{
    id: string
    name: string
    category: string
    location: string
    hotScore: number
    bestChannel: "email" | "whatsapp" | "instagram"
  } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [copiedSuggestion, setCopiedSuggestion] = useState<string | null>(null)
  const [contactedLeads, setContactedLeads] = useState<string[]>([])
  const [leads, setLeads] = useState<MyLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    salesCount: 0,
    leadCount: 0,
  })
  const [aiSuggestions, setAiSuggestions] = useState({
    target: "Lead listine gore AI hedefleme onerisi yukleniyor...",
    message: "Lead secildiginde AI mesaji uretilecek.",
    channel: "email",
    timing: "Tuesday-Thursday, 10am-2pm local time.",
  })
  const [credits, setCredits] = useState<CreditsState>({ balance: 0, creditsPerMon: 100 })
  const [tools, setTools] = useState<ToolItem[]>([])
  const [workspaceMetrics, setWorkspaceMetrics] = useState<WorkspaceMetrics | null>(null)
  const [placesQuery, setPlacesQuery] = useState("")
  const [placesLocation, setPlacesLocation] = useState("")
  const [placesResults, setPlacesResults] = useState<Array<{ name: string; formattedAddress: string }>>([])
  const [displayName, setDisplayName] = useState("Seller")

  useEffect(() => {
    const user = getSessionUser()
    if (user?.name) setDisplayName(user.name)
    setIsLoading(true)
    setLoadError(null)
    Promise.all([
      apiGet<{ stats: DashboardStats }>("/dashboard/seller", true),
      apiGet<MyLead[]>("/leads/mine", true),
    ])
      .then(([dashboardData, leadData]) => {
        setStats(dashboardData.stats)
        setLeads(leadData)
      })
      .catch((err) => {
        setLeads([])
        setLoadError(err instanceof Error ? err.message : "Dashboard data could not be loaded.")
      })
      .finally(() => setIsLoading(false))
    apiGet<CreditsState>("/credits/me", true).then(setCredits).catch(() => null)
    apiGet<ToolItem[]>("/credits/tools", true).then(setTools).catch(() => setTools([]))
    apiGet<WorkspaceMetrics>("/sales-workspaces/metrics/me", true).then(setWorkspaceMetrics).catch(() => null)
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

  const activityStats = useMemo(
    () => [
      { label: "Leads Assigned", value: stats.leadCount, change: "Live" },
      { label: "Deals Closed", value: stats.salesCount, change: "Verified sales" },
      { label: "Pending Earnings", value: Number(stats.pendingEarnings.toFixed(2)), change: "Awaiting payout" },
    ],
    [stats],
  )

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSuggestion(key)
    setTimeout(() => setCopiedSuggestion(null), 2000)
  }

  const handleLeadClick = async (lead: MyLead) => {
    setSelectedLead({
      id: lead.id,
      name: lead.companyName,
      category: "Lead",
      location: lead.location,
      hotScore: lead.score,
      bestChannel: lead.contactChannel ?? "email",
    })
    setModalOpen(true)
    const productName = "Selected Product"
    const generated = await apiPost<{ message: string; strategy: string }>(
      "/ai/sales-message",
      {
        companyName: lead.companyName,
        productName,
        productDescription: "Outbound sales optimization",
        channel: lead.contactChannel ?? "email",
      },
      true,
    ).catch(() => null)
    if (generated) {
      setAiSuggestions({
        target: `Focus on ${lead.companyName} with score ${lead.score}.`,
        message: generated.message,
        channel: generated.strategy,
        timing: "Follow up within 48 hours.",
      })
      apiGet<CreditsState>("/credits/me", true).then(setCredits).catch(() => null)
    }
  }

  const buyCredits = async () => {
    const next = await apiPost<CreditsState>("/credits/purchase", { monAmount: 1 }, true).catch(() => null)
    if (next) setCredits(next)
  }

  const generateStartupPlan = async () => {
    const output = await apiPost<{
      summary: string
      icp: string
      playbook: string[]
      kpis: string[]
    }>(
      "/ai/startup-plan",
      {
        startupName: "Selected Startup",
        productName: "Selected Product",
        productDescription: "B2B SaaS",
        targetMarket: "SMB",
        commissionPercent: 20,
      },
      true,
    ).catch(() => null)
    if (!output) return
    setAiSuggestions({
      target: output.icp,
      message: output.summary,
      channel: output.playbook?.[0] ?? "Outbound",
      timing: output.kpis?.join(" | ") ?? "Track weekly",
    })
    apiGet<CreditsState>("/credits/me", true).then(setCredits).catch(() => null)
  }

  const runPlacesSearch = async () => {
    if (!placesQuery) return
    const output = await apiPost<{ results: Array<{ name: string; formattedAddress: string }> }>(
      "/ai/places-search",
      {
        query: placesQuery,
        location: placesLocation || undefined,
        maxResults: 5,
      },
      true,
    ).catch(() => null)
    if (!output) return
    setPlacesResults(output.results ?? [])
    apiGet<CreditsState>("/credits/me", true).then(setCredits).catch(() => null)
  }

  const handleMarkContacted = (id: string) => {
    setContactedLeads(prev => [...prev, id])
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#1DBF73]"
    if (score >= 80) return "text-[#1DBF73]"
    if (score >= 70) return "text-[#FFC107]"
    return "text-[#95979D]"
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Welcome back, {displayName}
        </h1>
        <p className="text-[#95979D]">
          You have {leads.length} active leads waiting. Let&apos;s close some deals today.
        </p>
      </div>
      {isLoading && (
        <div className="mb-6 rounded-lg border border-[#404145] bg-[#222325] p-3 text-sm text-[#95979D]">
          Loading dashboard data...
        </div>
      )}
      {loadError && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#222325] border border-[#404145] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-[#1DBF73]/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-[#1DBF73]" />
            </div>
            <Badge className="text-xs gap-1 bg-[#1DBF73]/10 text-[#1DBF73] border-0">
              <ArrowUpRight className="h-3 w-3" />
              12%
            </Badge>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Total Earnings (MON)</p>
          <p className="text-2xl font-bold text-[#1DBF73]">{stats.totalEarnings.toFixed(2)} MON</p>
        </div>

        <div className="bg-[#222325] border border-[#404145] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-[#FFC107]/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#FFC107]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Pending Earnings (MON)</p>
          <p className="text-2xl font-bold text-white">{stats.pendingEarnings.toFixed(2)} MON</p>
        </div>

        <div className="bg-[#222325] border border-[#404145] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-[#446EE7]/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[#446EE7]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold text-white">{stats.salesCount > 0 ? `${((stats.salesCount / Math.max(stats.leadCount, 1)) * 100).toFixed(1)}%` : "0.0%"}</p>
        </div>

        <div className="bg-[#222325] border border-[#404145] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-[#446EE7]/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-[#446EE7]" />
            </div>
          </div>
          <p className="text-sm text-[#95979D] mb-1">Leads Used</p>
          <p className="text-2xl font-bold text-white">{stats.leadCount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Lead Feed */}
        <Card className="lg:col-span-2 bg-[#222325] border-[#404145]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#1DBF73]" />
              Lead Feed
            </CardTitle>
            <Badge variant="outline" className="border-[#1DBF73]/30 text-[#1DBF73]">
              {leads.length} hot leads
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.map((lead) => (
                <div 
                  key={lead.id} 
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    contactedLeads.includes(lead.id) 
                      ? "bg-[#2B2C2E]/50 border-[#404145]/50 opacity-60" 
                      : "bg-[#2B2C2E] border-[#404145] hover:border-[#1DBF73]/30"
                  }`}
                  onClick={() => handleLeadClick(lead)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#1DBF73]/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-[#1DBF73]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white">{lead.companyName}</p>
                          {contactedLeads.includes(lead.id) && (
                            <Badge className="text-xs gap-1 bg-[#1DBF73]/10 text-[#1DBF73] border-0">
                              <Check className="h-3 w-3" />
                              Contacted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#95979D] mb-2">Assigned lead</p>
                        <div className="flex items-center gap-3 text-xs text-[#95979D]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lead.location || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-[#1DBF73]" />
                        <span className={`text-sm font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </div>
                      <p className="text-xs text-[#95979D]">Hot Score</p>
                    </div>
                  </div>
                </div>
              ))}
              {!isLoading && !leads.length && (
                <div className="rounded-lg border border-[#404145] bg-[#2B2C2E] p-4 text-sm text-[#95979D]">
                  Assigned leads will appear here.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Sales Assistant */}
        <Card className="bg-[#222325] border-[#404145]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#1DBF73]" />
              AI Sales Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-[#2B2C2E] border border-[#404145]">
              <p className="text-sm text-white font-medium">AI Credits: {credits.balance}</p>
              <p className="text-xs text-[#95979D] mt-1">
                1 MON = {credits.creditsPerMon} credits
                {tools.length ? ` | ${tools.map((tool) => `${tool.displayName}: ${tool.creditCost}`).join(", ")}` : ""}
              </p>
              <Button size="sm" className="mt-3 bg-[#1DBF73] hover:bg-[#19A463] text-white" onClick={buyCredits}>
                Buy 1 MON Credits
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-[#1DBF73]/5 border border-[#1DBF73]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#1DBF73] flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Who to Target
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 hover:bg-[#2B2C2E]"
                  onClick={() => copyToClipboard(aiSuggestions.target, "target")}
                >
                  {copiedSuggestion === "target" ? <Check className="h-3 w-3 text-[#1DBF73]" /> : <Copy className="h-3 w-3 text-[#95979D]" />}
                </Button>
              </div>
              <p className="text-sm text-[#95979D]">{aiSuggestions.target}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#2B2C2E] border border-[#404145]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  What to Say
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 hover:bg-[#404145]"
                  onClick={() => copyToClipboard(aiSuggestions.message, "message")}
                >
                  {copiedSuggestion === "message" ? <Check className="h-3 w-3 text-[#1DBF73]" /> : <Copy className="h-3 w-3 text-[#95979D]" />}
                </Button>
              </div>
              <p className="text-sm text-[#95979D]">{aiSuggestions.message}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#2B2C2E] border border-[#404145]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Best Channel
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 hover:bg-[#404145]"
                  onClick={() => copyToClipboard(aiSuggestions.channel, "channel")}
                >
                  {copiedSuggestion === "channel" ? <Check className="h-3 w-3 text-[#1DBF73]" /> : <Copy className="h-3 w-3 text-[#95979D]" />}
                </Button>
              </div>
              <p className="text-sm text-[#95979D]">{aiSuggestions.channel}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#2B2C2E] border border-[#404145]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Best Timing
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 hover:bg-[#404145]"
                  onClick={() => copyToClipboard(aiSuggestions.timing, "timing")}
                >
                  {copiedSuggestion === "timing" ? <Check className="h-3 w-3 text-[#1DBF73]" /> : <Copy className="h-3 w-3 text-[#95979D]" />}
                </Button>
              </div>
              <p className="text-sm text-[#95979D]">{aiSuggestions.timing}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#2B2C2E] border border-[#404145] space-y-3">
              <Button className="w-full bg-[#446EE7] hover:bg-[#3355CC] text-white" onClick={generateStartupPlan}>
                Generate Startup Plan (AI)
              </Button>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  value={placesQuery}
                  onChange={(e) => setPlacesQuery(e.target.value)}
                  placeholder="Google Places query (ornek: coffee shops)"
                  className="bg-[#1A1B1D] border-[#404145] text-white"
                />
                <Input
                  value={placesLocation}
                  onChange={(e) => setPlacesLocation(e.target.value)}
                  placeholder="Location (ornek: Istanbul)"
                  className="bg-[#1A1B1D] border-[#404145] text-white"
                />
                <Button variant="outline" className="border-[#404145] text-white hover:bg-[#404145]" onClick={runPlacesSearch}>
                  Search Places (AI)
                </Button>
              </div>
              {placesResults.length > 0 && (
                <div className="space-y-2">
                  {placesResults.map((place) => (
                    <div key={`${place.name}-${place.formattedAddress}`} className="text-xs text-[#95979D]">
                      <span className="text-white">{place.name}</span> - {place.formattedAddress}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#222325] border border-[#404145] rounded-lg p-4">
          <p className="text-xs text-[#95979D] mb-1">Workspaces</p>
          <p className="text-xl font-bold text-white">{workspaceMetrics?.workspaceCount ?? 0}</p>
        </div>
        <div className="bg-[#222325] border border-[#404145] rounded-lg p-4">
          <p className="text-xs text-[#95979D] mb-1">Prospects</p>
          <p className="text-xl font-bold text-white">{workspaceMetrics?.prospectCount ?? 0}</p>
        </div>
        <div className="bg-[#222325] border border-[#404145] rounded-lg p-4">
          <p className="text-xs text-[#95979D] mb-1">AI Assets</p>
          <p className="text-xl font-bold text-white">{workspaceMetrics?.assetCount ?? 0}</p>
        </div>
        <div className="bg-[#222325] border border-[#404145] rounded-lg p-4">
          <p className="text-xs text-[#95979D] mb-1">Credits / Verified Sale</p>
          <p className="text-xl font-bold text-white">{workspaceMetrics?.creditsPerVerifiedSale ?? "-"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Stats */}
        <Card className="bg-[#222325] border-[#404145]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-[#446EE7]" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-3 rounded-lg bg-[#2B2C2E]">
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-[#95979D]">{stat.label}</p>
                </div>
                <Badge className="text-xs bg-[#1DBF73]/10 text-[#1DBF73] border-0">
                  {stat.change}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Earnings Chart */}
        <Card className="lg:col-span-2 bg-[#222325] border-[#404145]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Earnings Over Time (MON)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorEarnings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <LeadDetailModal 
        lead={selectedLead}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onMarkContacted={handleMarkContacted}
      />
    </div>
  )
}
