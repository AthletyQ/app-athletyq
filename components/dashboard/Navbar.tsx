"use client";

import { Activity, LayoutDashboard, Users, CalendarDays, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Coaches", href: "/coaches", icon: Users },
  { label: "Consultations", href: "/consultations", icon: CalendarDays },
  { label: "Chat", href: "/chat", icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">
            Athlet<span className="text-blue-500">yQ</span>
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
          <Image
            src="https://i.pravatar.cc/36?img=11"
            alt="Alex"
            width={36}
            height={36}
            className="object-cover"
          />
        </div>
      </div>
    </nav>
  );
}