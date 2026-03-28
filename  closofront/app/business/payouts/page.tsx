"use client"

import { apiGet } from "@/lib/api"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"

type Payout = {
  id: string
  amount: number
  status: string
  txHash?: string
  paidAt?: string
}

export default function BusinessPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<Payout[]>("/payouts/mine", true)
      .then(setPayouts)
      .catch((err) => setError(err instanceof Error ? err.message : "Payouts could not be loaded"))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payouts</h1>
      <p className="text-[#95979D] mb-8">Track MON payouts and transaction hashes.</p>
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      <div className="bg-[#222325] rounded-xl border border-[#404145] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#404145]">
              <th className="text-left p-4 text-[#95979D]">Amount</th>
              <th className="text-left p-4 text-[#95979D]">Status</th>
              <th className="text-left p-4 text-[#95979D]">Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-b border-[#404145]/50">
                <td className="p-4 text-white flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#1DBF73]" /> {payout.amount} MON
                </td>
                <td className="p-4">
                  <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0">{payout.status}</Badge>
                </td>
                <td className="p-4 text-[#95979D]">{payout.txHash ?? "-"}</td>
              </tr>
            ))}
            {!payouts.length && (
              <tr>
                <td className="p-6 text-center text-[#95979D]" colSpan={3}>
                  No payouts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
