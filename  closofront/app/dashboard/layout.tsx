import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#1A1B1D]">
      <DashboardSidebar />
      <main className="flex-1 pb-20 lg:pb-0 bg-[#1A1B1D]">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
