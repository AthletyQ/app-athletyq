"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserSearch,
  MessageSquare,
  PersonStanding,
  BarChart2,
  Copyright,
} from "lucide-react";

const mainItems = [
  { icon: LayoutDashboard, label: "Dashboard",    href: "/athlete/dashboard"    },
  { icon: Users,           label: "Coaches",      href: "/athlete/coaches"      },
  { icon: UserSearch,      label: "Consultants",  href: "/athlete/consultants"  },
  { icon: MessageSquare,   label: "Chats",        href: "/athlete/chats"        },
  { icon: PersonStanding,  label: "SmartPose",    href: "/athlete/pose-analyzer" },
];

const exploreItems = [
  { icon: BarChart2, label: "Performance Report", href: "/athlete/performance" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isPoseAnalyzer = pathname.startsWith('/athlete/pose-analyzer');

  return (
    <aside
      data-expanded={isPoseAnalyzer}
      className="
        group/sidebar
        relative flex flex-col h-screen flex-shrink-0
        bg-[#2563EB] text-white
        w-25 hover:w-70 data-[expanded=true]:w-70
        transition-all duration-300 ease-in-out
        overflow-hidden z-50
      "
    >
     
      <div className="h-20 flex items-center justify-center px-4 flex-shrink-0 overflow-hidden">
        
        <Link
          href="/athlete/dashboard"
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 text-white font-bold text-lg flex-shrink-0 group-hover/sidebar:hidden group-data-[expanded=true]/sidebar:hidden"
        >
          AQ
        </Link>
        
        <Link
          href="/athlete/dashboard"
          className="hidden group-hover/sidebar:block group-data-[expanded=true]/sidebar:block text-3xl font-bold tracking-tight text-white whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          AthletyQ
        </Link>
      </div>

      
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">

       
        <nav className="px-2 space-y-4">
          {mainItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-3
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-white text-blue-600 font-semibold shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                  justify-center group-hover/sidebar:justify-start group-data-[expanded=true]/sidebar:justify-start
                `}
              >
                <item.icon className="w-6 h-6 flex-shrink-0" />
                <span className="hidden group-hover/sidebar:block group-data-[expanded=true]/sidebar:block font-medium text-sm whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        
        <div className="my-3 mx-3 border-t border-white/10" />

        
        <div className="px-2">
          <p className="hidden group-hover/sidebar:block group-data-[expanded=true]/sidebar:block text-[10px] font-bold uppercase tracking-widest text-white/40 px-2 mb-2">
            Explore
          </p>
          <nav className="space-y-0.5">
            {exploreItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`
                    flex items-center gap-3 rounded-xl px-2 py-4
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-white text-blue-600 font-semibold shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                    justify-center group-hover/sidebar:justify-start group-data-[expanded=true]/sidebar:justify-start
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden group-hover/sidebar:block group-data-[expanded=true]/sidebar:block font-medium text-sm whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Copyright ── */}
      <div className="flex-shrink-0 border-t border-white/10 px-2 py-4 flex justify-center group-hover/sidebar:justify-start group-data-[expanded=true]/sidebar:justify-start group-hover/sidebar:px-4 group-data-[expanded=true]/sidebar:px-4">
        <div className="hidden group-hover/sidebar:block group-data-[expanded=true]/sidebar:block space-y-1">
          <div className="flex items-center gap-1.5 text-white/30">
            <Copyright className="w-3 h-3 flex-shrink-0" />
            <p className="text-[10px] whitespace-nowrap">2025 AthletyQ</p>
          </div>
          <p className="text-[10px] text-white/20">Terms · Privacy · About</p>
        </div>
        <Copyright className="w-4 h-4 text-white/30 group-hover/sidebar:hidden group-data-[expanded=true]/sidebar:hidden" />
      </div>
    </aside>
  );
}