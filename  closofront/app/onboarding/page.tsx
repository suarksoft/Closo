"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiPost } from "@/lib/api"
import { saveSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DollarSign, 
  Package, 
  Wallet, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Loader2,
  Sparkles
} from "lucide-react"

type UserType = "seller" | "business" | null
type Step = "choose" | "wallet" | "profile" | "complete"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<UserType>(null)
  const [step, setStep] = useState<Step>("choose")
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    walletAddress: "",
  })

  const handleWalletConnect = async () => {
    setError(null)
    setIsConnecting(true)
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask bulunamadı. Lütfen MetaMask eklentisini kur.")
      }
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[]
      const selected = accounts?.[0]
      if (!selected) throw new Error("Cuzdan adresi alinamadi.")
      setWalletConnected(true)
      setFormData((prev) => ({ ...prev, walletAddress: selected }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connect failed")
      setWalletConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleComplete = async () => {
    if (!userType) return
    setError(null)
    setIsSubmitting(true)
    try {
      if (!formData.walletAddress) {
        throw new Error("Önce MetaMask cüzdanını bağla.")
      }
      const challenge = await apiPost<{ message: string; nonce: string; expiresAtMinutes: number }>(
        "/auth/wallet/challenge",
        {
          walletAddress: formData.walletAddress,
          role: userType,
          name: formData.name,
          email: formData.email,
          companyName: userType === "business" ? formData.company : undefined,
        },
      )

      const signature = (await window.ethereum?.request({
        method: "personal_sign",
        params: [challenge.message, formData.walletAddress],
      })) as string
      if (!signature) throw new Error("Signature alınamadı.")

      const payload = await apiPost<{
        accessToken: string
        user: {
          id: string
          role: "seller" | "business" | "admin"
          email: string
          name: string
          walletAddress: string | null
        }
      }>("/auth/wallet/verify", {
        walletAddress: formData.walletAddress,
        message: challenge.message,
        signature,
        role: userType,
        name: formData.name,
        email: formData.email,
        companyName: userType === "business" ? formData.company : undefined,
      })
      saveSession(payload.accessToken, payload.user)
      router.push(userType === "seller" ? "/marketplace" : "/business")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const goNext = () => {
    if (step === "choose" && userType) {
      setStep("wallet")
    } else if (step === "wallet" && walletConnected) {
      setStep("profile")
    } else if (step === "profile" && formData.name && formData.email) {
      setStep("complete")
    }
  }

  const goBack = () => {
    if (step === "wallet") {
      setStep("choose")
      setUserType(null)
    } else if (step === "profile") {
      setStep("wallet")
    } else if (step === "complete") {
      setStep("profile")
    }
  }

  const stepIndex = ["choose", "wallet", "profile", "complete"].indexOf(step)

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="h-10 w-10 rounded-xl bg-[#222325] flex items-center justify-center">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <span className="text-xl font-bold text-[#222325]">Closo</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {["choose", "wallet", "profile", "complete"].map((s, index) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                index <= stepIndex
                  ? "w-10 bg-[#1DBF73]"
                  : "w-10 bg-[#E4E5E7]"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Choose User Type */}
        {step === "choose" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#222325] mb-2">
                How would you like to use Closo?
              </h1>
              <p className="text-[#74767E]">
                Choose your path to get started
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setUserType("seller")}
                className={`bg-white rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
                  userType === "seller" ? "border-[#1DBF73] shadow-md" : "border-[#E4E5E7]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-[#1DBF73]/10 flex items-center justify-center shrink-0">
                    <DollarSign className="h-7 w-7 text-[#1DBF73]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#222325] mb-1">
                      I want to earn money
                    </h3>
                    <p className="text-sm text-[#74767E]">
                      Sell products and earn crypto commissions
                    </p>
                  </div>
                  {userType === "seller" && (
                    <div className="h-6 w-6 rounded-full bg-[#1DBF73] flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setUserType("business")}
                className={`bg-white rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
                  userType === "business" ? "border-[#1DBF73] shadow-md" : "border-[#E4E5E7]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-[#446EE7]/10 flex items-center justify-center shrink-0">
                    <Package className="h-7 w-7 text-[#446EE7]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#222325] mb-1">
                      I want to list my product
                    </h3>
                    <p className="text-sm text-[#74767E]">
                      Get affiliates to help sell your SaaS
                    </p>
                  </div>
                  {userType === "business" && (
                    <div className="h-6 w-6 rounded-full bg-[#1DBF73] flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            <Button 
              className="w-full h-12 bg-[#222325] hover:bg-[#404145] text-white font-medium" 
              disabled={!userType}
              onClick={goNext}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Connect Wallet */}
        {step === "wallet" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-[#74767E] hover:text-[#222325] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#222325] mb-2">
                Connect Your Wallet
              </h1>
              <p className="text-[#74767E]">
                Connect your MetaMask wallet to receive crypto payments
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E4E5E7] p-8 text-center">
              <div className="h-20 w-20 rounded-2xl bg-[#FAFAFA] flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-10 w-10 text-[#222325]" />
              </div>

              {!walletConnected ? (
                <>
                  <p className="text-sm text-[#74767E] mb-6">
                    MetaMask wallet ile güvenli giriş ve imza doğrulama
                  </p>
                  <Button 
                    className="w-full h-12 bg-[#222325] hover:bg-[#404145] text-white font-medium" 
                    onClick={handleWalletConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Wallet"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-[#1DBF73] mb-4">
                    <div className="h-6 w-6 rounded-full bg-[#1DBF73] flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold">Wallet Connected</span>
                  </div>
                  <p className="text-sm text-[#74767E] mb-2">Connected to:</p>
                  <code className="text-sm bg-[#FAFAFA] px-4 py-2 rounded-lg inline-block border border-[#E4E5E7] text-[#222325]">
                    {formData.walletAddress}
                  </code>
                </>
              )}
            </div>

            <Button 
              className="w-full h-12 bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium" 
              disabled={!walletConnected}
              onClick={goNext}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 3: Profile */}
        {step === "profile" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-[#74767E] hover:text-[#222325] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#222325] mb-2">
                Complete Your Profile
              </h1>
              <p className="text-[#74767E]">
                Tell us a bit about yourself
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E4E5E7] p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#222325] font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="h-12 bg-[#FAFAFA] border-[#E4E5E7] text-[#222325] focus:border-[#222325]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#222325] font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="h-12 bg-[#FAFAFA] border-[#E4E5E7] text-[#222325] focus:border-[#222325]"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {userType === "business" && (
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-[#222325] font-medium">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Closo Inc."
                    className="h-12 bg-[#FAFAFA] border-[#E4E5E7] text-[#222325] focus:border-[#222325]"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              )}
            </div>

            <Button 
              className="w-full h-12 bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium" 
              disabled={!formData.name || !formData.email}
              onClick={goNext}
            >
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <div className="space-y-8 text-center">
            <div className="h-24 w-24 rounded-full bg-[#1DBF73]/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-12 w-12 text-[#1DBF73]" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#222325] mb-3">
                You&apos;re All Set!
              </h1>
              <p className="text-[#74767E]">
                {userType === "seller"
                  ? "Start browsing products and earning commissions"
                  : "List your first product and start growing"}
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button 
              className="w-full h-12 bg-[#1DBF73] hover:bg-[#19A463] text-white font-medium" 
              disabled={isSubmitting}
              onClick={handleComplete}
            >
              {isSubmitting ? "Creating account..." : userType === "seller" ? "Go to Dashboard" : "Go to Business Panel"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#74767E] mt-10">
          By continuing, you agree to our{" "}
          <Link href="#" className="text-[#222325] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-[#222325] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  )
}
