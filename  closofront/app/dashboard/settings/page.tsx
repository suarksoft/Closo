"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Wallet, Bell, Shield, User, Check } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-[#95979D]">
          Manage your account preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="bg-[#222325] rounded-xl border border-[#404145]">
          <div className="p-5 border-b border-[#404145]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-[#446EE7]" />
              Profile
            </h2>
            <p className="text-sm text-[#95979D]">Your personal information</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input 
                  id="name" 
                  defaultValue="John Doe" 
                  className="bg-[#2B2C2E] border-[#404145] text-white placeholder:text-[#95979D] focus:border-[#1DBF73]" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue="john@example.com" 
                  className="bg-[#2B2C2E] border-[#404145] text-white placeholder:text-[#95979D] focus:border-[#1DBF73]" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-[#222325] rounded-xl border border-[#404145]">
          <div className="p-5 border-b border-[#404145]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#1DBF73]" />
              Wallet
            </h2>
            <p className="text-sm text-[#95979D]">Your connected wallet for payouts</p>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#2B2C2E]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#1DBF73]/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-[#1DBF73]" />
                </div>
                <div>
                  <p className="font-medium text-white">MetaMask</p>
                  <code className="text-xs text-[#95979D]">0x1234...5678</code>
                </div>
              </div>
              <Badge className="bg-[#1DBF73]/10 text-[#1DBF73] border-0">Connected</Badge>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#222325] rounded-xl border border-[#404145]">
          <div className="p-5 border-b border-[#404145]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#FFC107]" />
              Notifications
            </h2>
            <p className="text-sm text-[#95979D]">Configure your notification preferences</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Email notifications</p>
                <p className="text-sm text-[#95979D]">Receive sales and payout updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">New lead alerts</p>
                <p className="text-sm text-[#95979D]">Get notified when new leads are available</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Weekly reports</p>
                <p className="text-sm text-[#95979D]">Receive weekly performance summaries</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-[#222325] rounded-xl border border-[#404145]">
          <div className="p-5 border-b border-[#404145]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#446EE7]" />
              Security
            </h2>
            <p className="text-sm text-[#95979D]">Keep your account secure</p>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Two-factor authentication</p>
                <p className="text-sm text-[#95979D]">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm" className="border-[#404145] text-white hover:bg-[#2B2C2E]">
                Enable
              </Button>
            </div>
          </div>
        </div>

        <Button 
          className="w-full h-12 bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium"
          onClick={handleSave}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
