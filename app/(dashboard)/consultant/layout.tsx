"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/dashboard/ConsultantSidebar";
import { Navbar } from "@/components/dashboard/Navbar";

export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex w-full">
            {/* Consultant Sidebar */}
            <Sidebar />

            {/* Right side */}
            <SidebarInset className="flex flex-col flex-1">
                <Navbar />
                <main className="flex-1 bg-gray-50 p-6">
                    {children}
                </main>
            </SidebarInset>
        </div>
    );
}
