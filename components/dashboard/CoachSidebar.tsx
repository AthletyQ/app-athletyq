"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarCheck,
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
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",       href: "/coach/dashboard"      },
  { icon: Users,           label: "Clients",         href: "/coach/client"         },
  { icon: CalendarCheck,   label: "Booked Sessions", href: "/coach/bookedsessions" },
  { icon: MessageSquare,   label: "Chats",           href: "/coach/chat"           },
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
      className="border-r-0"
      {...props}
    >
      {/* ── Header ── */}
      <SidebarHeader className={cn("h-20", open ? "px-4" : "px-2")}>
        <div className={cn("flex items-center h-full w-full", open ? "justify-between" : "justify-center")}>
          <div className={cn("transition-all duration-200 overflow-hidden", open ? "opacity-100 w-auto" : "opacity-0 w-0")}>
            <Link
              href="/coach/dashboard"
              className="text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              AthletyQ
            </Link>
          </div>
          <CollapseButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      size="lg"
                      className={cn(
                        "rounded-xl transition-all duration-150",
                        isActive
                          ? "bg-white text-blue-700 font-semibold shadow-sm hover:bg-white/95"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="font-medium">{item.label}</span>
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
