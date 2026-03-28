"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Info } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiPost } from "@/lib/api"
import { useRouter } from "next/navigation"

const categories = [
  "Productivity",
  "Analytics",
  "Security",
  "Communication",
  "Marketing",
  "Development",
  "Design",
  "Finance",
]

export default function AddProductPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    commission: "",
    website: "",
    features: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await apiPost(
        "/products",
        {
          title: formData.name,
          description: formData.description,
          category: formData.category || "General",
          price: Number(formData.price),
          commissionValue: Number(formData.commission),
          website: formData.website,
        },
        true,
      )
      router.push("/business")
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Product could not be created.")
    } finally {
      setSubmitting(false)
    }
  }

  const calculatedEarnings = formData.price && formData.commission
    ? ((parseFloat(formData.price) * parseFloat(formData.commission)) / 100).toFixed(2)
    : "0.00"

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link 
        href="/business" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Add New Product
        </h1>
        <p className="text-muted-foreground">
          List your SaaS product and let affiliates help you grow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {submitError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {submitError}
          </div>
        )}
        {/* Basic Info */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Basic Information</CardTitle>
            <CardDescription>Tell us about your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="e.g., CloudSync Pro"
                className="bg-secondary border-border"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product in a few sentences..."
                className="bg-secondary border-border min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Product Website</Label>
                <Input
                  id="website"
                  placeholder="https://yourproduct.com"
                  className="bg-secondary border-border"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Key Features (one per line)</Label>
              <Textarea
                id="features"
                placeholder="Real-time sync&#10;End-to-end encryption&#10;Mobile apps"
                className="bg-secondary border-border min-h-[100px]"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Commission */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Pricing & Commission</CardTitle>
            <CardDescription>Set your pricing and affiliate commission rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price (MON)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">M</span>
                  <Input
                    id="price"
                    type="number"
                    placeholder="49"
                    className="bg-secondary border-border pl-8"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <div className="relative">
                  <Input
                    id="commission"
                    type="number"
                    placeholder="30"
                    min="1"
                    max="50"
                    className="bg-secondary border-border pr-8"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {/* Commission Preview */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Affiliate Earnings Preview
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Affiliates will earn <span className="text-primary font-medium">{calculatedEarnings} MON</span> per sale.
                    {formData.commission && parseFloat(formData.commission) >= 20 && (
                      <span className="text-primary"> Higher commissions attract more affiliates!</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/business">Cancel</Link>
          </Button>
          <Button type="submit" className="glow-primary" disabled={submitting}>
            {submitting ? "Listing..." : "List Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}
