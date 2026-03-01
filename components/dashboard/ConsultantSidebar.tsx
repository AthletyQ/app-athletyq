"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    UserSearch,
    MessageSquare
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
} from "@/components/ui/sidebar";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/consultant/dashboard" },
    { icon: Users, label: "Athletes", href: "/consultant/coaches" },
    { icon: UserSearch, label: "Coaches", href: "/consultant/consultants" },
    { icon: MessageSquare, label: "Chats", href: "/consultant/chats" },
];

export function Sidebar({ ...props }: React.ComponentProps<typeof BaseSidebar>) {
    const pathname = usePathname();

    return (
        <BaseSidebar className="border-r-0" {...props}>
            <SidebarHeader className="h-20 flex items-center justify-start px-6">
                <h1 className="text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
                    <Link href="/athlete/dashboard">AthletyQ</Link>
                </h1>
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
                                                    ? "bg-white !text-[var(--athletyq-white)] hover:bg-white/90 shadow-sm"
                                                    : "text-white/90 hover:bg-white/10 hover:text-white transition-colors"
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
