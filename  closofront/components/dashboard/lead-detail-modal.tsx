"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Copy, 
  Check,
  MapPin, 
  Building2,
  Sparkles,
  Mail,
  MessageCircle,
  Phone
} from "lucide-react"
import { useState } from "react"

interface Lead {
  id: string
  name: string
  category: string
  location: string
  hotScore: number
  email?: string
  phone?: string
  website?: string
  employeeCount?: string
  revenue?: string
  aiReason?: string
  suggestedMessage?: string
  bestChannel?: "email" | "whatsapp" | "instagram"
}

interface LeadDetailModalProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkContacted: (id: string) => void
}

export function LeadDetailModal({ lead, open, onOpenChange, onMarkContacted }: LeadDetailModalProps) {
  const [copied, setCopied] = useState(false)
  const [contacted, setContacted] = useState(false)

  if (!lead) return null

  const defaultMessage = lead.suggestedMessage || `Hi! I noticed ${lead.name} is doing great things in the ${lead.category} space. I&apos;d love to show you a tool that could help streamline your operations and boost productivity. Would you be open to a quick 10-minute call this week?`

  const copyMessage = () => {
    navigator.clipboard.writeText(defaultMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMarkContacted = () => {
    setContacted(true)
    onMarkContacted(lead.id)
    setTimeout(() => {
      onOpenChange(false)
      setContacted(false)
    }, 1000)
  }

  const channelIcons = {
    email: <Mail className="h-4 w-4" />,
    whatsapp: <MessageCircle className="h-4 w-4" />,
    instagram: <MessageCircle className="h-4 w-4" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-[#10B981]"
    if (score >= 80) return "from-[#2563EB]"
    if (score >= 70) return "from-[#F59E0B]"
    return "from-[#9CA3AF]"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-foreground">{lead.name}</p>
              <p className="text-sm text-muted-foreground font-normal">{lead.category}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Business Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{lead.location}</span>
              </div>
            </div>
            <div className="bg-secondary rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Hot Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[#0B0F14] rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getScoreColor(lead.hotScore)} to-[#22D3EE] rounded-full`}
                    style={{ width: `${lead.hotScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[#2563EB]">{lead.hotScore}</span>
              </div>
            </div>
            {lead.employeeCount && (
              <div className="bg-secondary rounded-xl p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Team Size</p>
                <p className="text-sm text-foreground">{lead.employeeCount} employees</p>
              </div>
            )}
            {lead.revenue && (
              <div className="bg-secondary rounded-xl p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Est. Revenue</p>
                <p className="text-sm text-foreground">{lead.revenue}</p>
              </div>
            )}
          </div>

          {/* AI Explanation */}
          <div className="bg-[#2563EB]/5 rounded-xl p-4 border border-[#2563EB]/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#2563EB]" />
              <span className="text-sm font-medium text-foreground">Why This Lead is Hot</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {lead.aiReason || `${lead.name} recently expanded their team and is actively looking for productivity tools. Their ${lead.category} focus means they&apos;re likely to benefit from automation. High engagement signals detected.`}
            </p>
          </div>

          {/* Best Channel */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Best channel:</span>
            <Badge className="gap-1.5 bg-[#22D3EE]/10 text-[#22D3EE] border-0">
              {channelIcons[lead.bestChannel || "email"]}
              {lead.bestChannel === "whatsapp" ? "WhatsApp" : lead.bestChannel === "instagram" ? "Instagram" : "Email"}
            </Badge>
          </div>

          {/* Suggested Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Suggested Message</span>
              <Button variant="ghost" size="sm" onClick={copyMessage} className="h-8 gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-sm text-muted-foreground border border-border">
              {defaultMessage}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-[#2563EB] hover:bg-[#1d4ed8] glow-primary"
              onClick={handleMarkContacted}
              disabled={contacted}
            >
              {contacted ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Marked as Contacted
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Mark as Contacted
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
