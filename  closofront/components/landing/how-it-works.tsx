import { Sparkles, Link2, Target } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    icon: Link2,
    title: "1) Pick a product from the marketplace",
    description: "Add it to your dashboard and open its sales workspace.",
  },
  {
    icon: Sparkles,
    title: "2) Generate the AI sales package",
    description: "Get product-specific scripts, sequences, objections, and ready messaging.",
  },
  {
    icon: Target,
    title: "3) Find prospects and close deals",
    description: "Use Google Places and outreach flows to convert faster.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-12 bg-white border-b border-[#E4E5E7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-light text-[#222325] mb-6">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <Link
              key={step.title}
              href="/marketplace"
              className="p-5 rounded-lg border border-[#E4E5E7] hover:border-[#222325] hover:shadow-md transition-all group cursor-pointer"
            >
              <step.icon className="h-6 w-6 text-[#222325] mb-3 group-hover:text-[#1DBF73] transition-colors" />
              <p className="text-sm font-medium text-[#222325] mb-1">{step.title}</p>
              <p className="text-xs text-[#74767E] leading-relaxed">{step.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
