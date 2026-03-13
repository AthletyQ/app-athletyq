import { SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 antialiased text-gray-900 w-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}