'use client'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Sidebar } from '@/components/dashboard/CoachSidebar'
import { CoachTopbar } from '@/components/dashboard/CoachTopbar'

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={{ "--sidebar-background": "hsl(221 83% 53%)" } as React.CSSProperties}
    >
      <div id="main-layout-wrapper" className="min-h-screen flex w-full">
        <Sidebar />
        <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden">
          {/* ✅ Global topbar — appears on all coach pages */}
          <CoachTopbar />
          <main className="flex-1 bg-gray-50 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}