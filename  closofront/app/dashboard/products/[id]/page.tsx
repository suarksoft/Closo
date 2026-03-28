"use client"

import Link from "next/link"
import { use, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Copy, Download, Loader2, RefreshCw, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiGet, apiPost } from "@/lib/api"

type WorkspaceResponse = {
  workspace: { id: string; sellerId: string; productId: string; status: string }
  product: { id: string; title: string; description: string; category: string; commissionValue: number }
  prospects: Array<{ id: string; companyName: string; location?: string; score?: number; source?: string }>
  assets: Array<{ id: string; assetType: string; content: string; persona?: string; tone?: string; version: number }>
  sequences: Array<{ id: string; channel: string; stepNo: number; delayHours: number; goal?: string }>
  kpis: { prospectCount: number; assetCount: number; sequenceStepCount: number }
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

const tabItems = ["brief", "prospects", "scripts", "sequences", "assets"] as const
type TabKey = (typeof tabItems)[number]

export default function ProductWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params)
  const productId = resolved.id

  const [activeTab, setActiveTab] = useState<TabKey>("brief")
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null)
  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const groupedAssets = useMemo(() => {
    if (!workspace) return {}
    return workspace.assets.reduce<Record<string, Array<WorkspaceResponse["assets"][number]>>>((acc, asset) => {
      const key = asset.assetType
      if (!acc[key]) acc[key] = []
      acc[key].push(asset)
      return acc
    }, {})
  }, [workspace])

  const loadWorkspace = async () => {
    setLoading(true)
    setError(null)
    setInfoMessage(null)
    try {
      await apiPost(`/sales-workspaces/${productId}/bootstrap`, {}, true)
      const [workspaceData, metricsData] = await Promise.all([
        apiGet<WorkspaceResponse>(`/sales-workspaces/${productId}`, true),
        apiGet<WorkspaceMetrics>("/sales-workspaces/metrics/me", true),
      ])
      setWorkspace(workspaceData)
      setMetrics(metricsData)
    } catch (err) {
      setWorkspace(null)
      setMetrics(null)
      setError(err instanceof Error ? err.message : "Workspace could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspace().catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const generatePackage = async () => {
    if (!workspace) return
    setBusyAction("generate")
    setInfoMessage(null)
    try {
      const data = await apiPost<WorkspaceResponse>(
        `/sales-workspaces/${workspace.workspace.id}/generate-package`,
        {},
        true,
      )
      setWorkspace(data)
      setInfoMessage("Full sales package generated.")
      const metricsData = await apiGet<WorkspaceMetrics>("/sales-workspaces/metrics/me", true)
      setMetrics(metricsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Package generation failed.")
    } finally {
      setBusyAction(null)
    }
  }

  const searchProspects = async () => {
    if (!workspace || !query.trim()) return
    setBusyAction("prospects")
    setInfoMessage(null)
    try {
      await apiPost(
        `/sales-workspaces/${workspace.workspace.id}/prospects/search`,
        {
          query: query.trim(),
          location: location.trim() || undefined,
          maxResults: 5,
        },
        true,
      )
      await loadWorkspace()
      setInfoMessage("Prospects updated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prospect search failed.")
    } finally {
      setBusyAction(null)
    }
  }

  const regenerate = async (assetType: string) => {
    if (!workspace) return
    setBusyAction(assetType)
    setInfoMessage(null)
    try {
      const regenerated = await apiPost<WorkspaceResponse["assets"][number]>(
        `/sales-workspaces/${workspace.workspace.id}/assets/regenerate`,
        { assetType },
        true,
      )
      setWorkspace((prev) => {
        if (!prev) return prev
        return { ...prev, assets: [regenerated, ...prev.assets] }
      })
      setInfoMessage(`${assetType} regenerated.`)
      const metricsData = await apiGet<WorkspaceMetrics>("/sales-workspaces/metrics/me", true)
      setMetrics(metricsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Asset regeneration failed.")
    } finally {
      setBusyAction(null)
    }
  }

  const exportWorkspace = async () => {
    if (!workspace) return
    setBusyAction("export")
    try {
      const exported = await apiGet(`/sales-workspaces/${workspace.workspace.id}/export`, true)
      await navigator.clipboard.writeText(JSON.stringify(exported, null, 2))
      setInfoMessage("Workspace export copied to clipboard.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/dashboard/products" className="inline-flex items-center gap-2 text-[#95979D] hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to My Products
      </Link>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      {infoMessage && (
        <div className="mb-6 rounded-lg border border-[#1DBF73]/40 bg-[#1DBF73]/10 p-3 text-sm text-[#1DBF73]">
          {infoMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[#404145] bg-[#222325] p-6 text-[#95979D] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sales workspace...
        </div>
      ) : workspace ? (
        <>
          <div className="mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{workspace.product.title} Sales Workspace</h1>
              <p className="text-[#95979D] mt-1">
                Aggressive prep: product-specific scripts, prospects, sequences, and objections.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white" onClick={generatePackage} disabled={busyAction === "generate"}>
                <Sparkles className="h-4 w-4 mr-2" />
                {busyAction === "generate" ? "Generating..." : "Generate Full Sales Package"}
              </Button>
              <Button
                variant="outline"
                className="bg-[#1A1B1D] border-[#404145] text-[#E4E5E7] hover:bg-[#2B2C2E] hover:text-white"
                onClick={exportWorkspace}
                disabled={busyAction === "export"}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg border border-[#404145] bg-[#222325] p-4">
              <p className="text-xs text-[#95979D]">Prospects</p>
              <p className="text-2xl font-bold text-white">{workspace.kpis.prospectCount}</p>
            </div>
            <div className="rounded-lg border border-[#404145] bg-[#222325] p-4">
              <p className="text-xs text-[#95979D]">Assets</p>
              <p className="text-2xl font-bold text-white">{workspace.kpis.assetCount}</p>
            </div>
            <div className="rounded-lg border border-[#404145] bg-[#222325] p-4">
              <p className="text-xs text-[#95979D]">Sequence Steps</p>
              <p className="text-2xl font-bold text-white">{workspace.kpis.sequenceStepCount}</p>
            </div>
            <div className="rounded-lg border border-[#404145] bg-[#222325] p-4">
              <p className="text-xs text-[#95979D]">Credits / Verified Sale</p>
              <p className="text-2xl font-bold text-white">{metrics?.creditsPerVerifiedSale ?? "-"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {tabItems.map((tab) => (
              <Button
                key={tab}
                variant="outline"
                className={
                  activeTab === tab
                    ? "bg-[#1DBF73]/15 border-[#1DBF73] text-[#1DBF73] hover:bg-[#1DBF73]/20"
                    : "bg-[#1A1B1D] border-[#404145] text-[#E4E5E7] hover:bg-[#2B2C2E] hover:text-white"
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab.toUpperCase()}
              </Button>
            ))}
          </div>

          {activeTab === "brief" && (
            <div className="rounded-xl border border-[#404145] bg-[#222325] p-5 space-y-3">
              <p className="text-sm text-[#95979D]">Category: {workspace.product.category}</p>
              <p className="text-sm text-white">{workspace.product.description}</p>
              <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0">{workspace.product.commissionValue}% commission</Badge>
              {metrics && (
                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-lg border border-[#404145] p-3">
                    <p className="text-xs text-[#95979D]">Workspace Runs</p>
                    <p className="text-lg font-semibold text-white">{metrics.totalRuns}</p>
                  </div>
                  <div className="rounded-lg border border-[#404145] p-3">
                    <p className="text-xs text-[#95979D]">Total Credits Spent</p>
                    <p className="text-lg font-semibold text-white">{metrics.totalCreditsSpent}</p>
                  </div>
                  <div className="rounded-lg border border-[#404145] p-3">
                    <p className="text-xs text-[#95979D]">Verified Sales</p>
                    <p className="text-lg font-semibold text-white">{metrics.verifiedSales}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "prospects" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#404145] bg-[#222325] p-4">
                <div className="grid md:grid-cols-3 gap-2">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Query (ex: ai agencies)" className="bg-[#1A1B1D] border-[#404145] text-white" />
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (ex: Istanbul)" className="bg-[#1A1B1D] border-[#404145] text-white" />
                  <Button onClick={searchProspects} disabled={busyAction === "prospects"} className="bg-[#446EE7] hover:bg-[#3355CC] text-white">
                    <Search className="h-4 w-4 mr-2" />
                    {busyAction === "prospects" ? "Searching..." : "Search Prospects"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {workspace.prospects.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[#404145] bg-[#222325] p-4">
                    <p className="text-white font-medium">{p.companyName}</p>
                    <p className="text-xs text-[#95979D]">{p.location ?? "Unknown location"}</p>
                    <p className="text-xs text-[#95979D] mt-1">Score: {p.score ?? "-"}</p>
                  </div>
                ))}
                {!workspace.prospects.length && (
                  <div className="rounded-xl border border-[#404145] bg-[#222325] p-4 text-sm text-[#95979D]">No prospects yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "scripts" && (
            <div className="grid gap-4">
              {["email_subject", "email_body", "wa_message", "ig_dm", "call_script", "objection_reply"].map((type) => {
                const versions = groupedAssets[type] ?? []
                const latest = versions[0]
                return (
                  <div key={type} className="rounded-xl border border-[#404145] bg-[#222325] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{type}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#2B2C2E] text-[#95979D] border-0">v{latest?.version ?? "-"}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-[#1A1B1D] border-[#404145] text-[#E4E5E7] hover:bg-[#2B2C2E] hover:text-white"
                          onClick={() => regenerate(type)}
                          disabled={busyAction === type}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Regen
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-[#95979D] whitespace-pre-wrap">{latest?.content ?? "Not generated yet."}</p>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === "sequences" && (
            <div className="rounded-xl border border-[#404145] bg-[#222325] p-4">
              <div className="grid gap-2">
                {workspace.sequences.map((step) => (
                  <div key={step.id} className="rounded-lg border border-[#404145] bg-[#2B2C2E] p-3">
                    <p className="text-white font-medium">
                      {step.channel.toUpperCase()} - Step {step.stepNo}
                    </p>
                    <p className="text-xs text-[#95979D]">Delay: {step.delayHours}h</p>
                    <p className="text-sm text-[#95979D] mt-1">{step.goal ?? "-"}</p>
                  </div>
                ))}
                {!workspace.sequences.length && <p className="text-sm text-[#95979D]">No sequence generated yet.</p>}
              </div>
            </div>
          )}

          {activeTab === "assets" && (
            <div className="rounded-xl border border-[#404145] bg-[#222325] p-4 space-y-3">
              {workspace.assets.map((asset) => (
                <div key={asset.id} className="rounded-lg border border-[#404145] bg-[#2B2C2E] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm">{asset.assetType}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0">v{asset.version}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[#95979D] hover:text-white"
                        onClick={() => navigator.clipboard.writeText(asset.content)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-[#95979D] whitespace-pre-wrap">{asset.content}</p>
                </div>
              ))}
              {!workspace.assets.length && <p className="text-sm text-[#95979D]">No assets yet.</p>}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
