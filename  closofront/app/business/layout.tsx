import { BusinessSidebar } from "@/components/business/sidebar"

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <BusinessSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
