"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserSearch,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/athlete/dashboard"   },
  { icon: Users,           label: "Coaches",     href: "/athlete/coaches"     },
  { icon: UserSearch,      label: "Consultants", href: "/athlete/consultants" },
  { icon: MessageSquare,   label: "Chats",       href: "/athlete/chats"       },
];

function CollapseButton() {
  const { open, toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      title={open ? "Collapse sidebar" : "Expand sidebar"}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
    >
      {open
        ? <PanelLeftClose className="w-5 h-5" />
        : <PanelLeftOpen  className="w-5 h-5" />
      }
    </button>
  );
}

export function Sidebar({ ...props }: React.ComponentProps<typeof BaseSidebar>) {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <BaseSidebar
  collapsible="icon"
  className="border-r-0 bg-[#1e2d3d]"
  style={{ '--sidebar-background': '#1e2d3d' } as React.CSSProperties}
  {...props}
>

      {/* ── Header: logo left, collapse button right ── */}
      <SidebarHeader className="h-20 px-4">
        <div className="flex items-center justify-between h-full w-full">
          {/* Logo — only visible when expanded */}
          <div className={`transition-all duration-200 overflow-hidden ${open ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <Link
              href="/athlete/dashboard"
              className="text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              AthletyQ
            </Link>
          </div>

          {/* Collapse toggle — always visible, pushed to the right */}
          <CollapseButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? "bg-white/20 text-white hover:bg-white/25 shadow-sm"
                          : "text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      }
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="font-medium text-base">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail className="hover:after:bg-white/20" />
    </BaseSidebar>
  );
}