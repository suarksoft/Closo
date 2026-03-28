import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-[#222325] rounded-2xl py-16 px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white font-light mb-8">
            Launch your startup product now,{" "}
            <span className="italic text-[#1DBF73]">grow sales output with AI</span>
          </h2>
          <Button 
            size="lg" 
            className="bg-white text-[#222325] hover:bg-gray-100 font-medium px-8 h-12 rounded-md"
            asChild
          >
            <Link href="/onboarding">
              Join Closo
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
