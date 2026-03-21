import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/dashboard/AthleteSidebar";
import { Navbar } from "@/components/dashboard/Navbar";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 antialiased text-gray-900 w-full">
        <Sidebar />
        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}