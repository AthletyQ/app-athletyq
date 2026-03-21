import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/dashboard/AthleteSidebar";
import { Navbar } from "@/components/dashboard/Navbar";

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // SidebarProvider manages open/collapsed state across Sidebar + Trigger
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 antialiased text-gray-900 w-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col min-w-0 flex-1 overflow-hidden">
          {/* Navbar */}
          <Navbar />

          {/* Page Content — only this scrolls */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}