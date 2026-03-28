"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiGet, apiPatch } from "@/lib/api"

type BusinessDashboardResponse = {
  profile: {
    id: string
    name: string
    email: string
    companyName: string | null
    walletAddress: string | null
    status: string
    createdAt: string
  } | null
}

export default function BusinessSettingsPage() {
  const [companyName, setCompanyName] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiGet<BusinessDashboardResponse>("/dashboard/business", true)
      .then((data) => {
        setCompanyName(data.profile?.companyName ?? "")
        setWalletAddress(data.profile?.walletAddress ?? "")
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Settings could not be loaded."))
      .finally(() => setLoading(false))
  }, [])

  const saveChanges = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    const result = await apiPatch(
      "/dashboard/business/profile",
      {
        companyName: companyName.trim() || null,
        walletAddress: walletAddress.trim() || null,
      },
      true,
    ).catch((err) => {
      setError(err instanceof Error ? err.message : "Settings update failed.")
      return null
    })
    if (!result) {
      setSaving(false)
      return
    }
    setMessage("Business profile updated.")
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Business Settings</h1>
      <p className="text-[#95979D] mb-8">Manage profile and payout preferences.</p>
      {loading && <div className="mb-4 rounded-lg border border-[#404145] bg-[#222325] p-3 text-sm text-[#95979D]">Loading settings...</div>}
      {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {message && <div className="mb-4 rounded-lg border border-[#1DBF73]/40 bg-[#1DBF73]/10 p-3 text-sm text-[#1DBF73]">{message}</div>}

      <div className="space-y-6 bg-[#222325] border border-[#404145] rounded-xl p-6">
        <div className="space-y-2">
          <Label htmlFor="company" className="text-white">Company Name</Label>
          <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-[#1A1B1D] border-[#404145] text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wallet" className="text-white">Payout Wallet</Label>
          <Input id="wallet" placeholder="0x..." value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="bg-[#1A1B1D] border-[#404145] text-white" />
        </div>
        <Button className="bg-[#1DBF73] hover:bg-[#19A463] text-white" onClick={saveChanges} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
