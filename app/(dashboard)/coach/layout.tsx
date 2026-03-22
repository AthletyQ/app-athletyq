import { Sidebar } from "@/components/dashboard/CoachSidebar";
import { Navbar } from "@/components/dashboard/Navbar";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 antialiased text-gray-900 w-full">
      <Sidebar />
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}