'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, MessageSquare, CalendarCheck,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider,
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/coach/dashboard' },
  { icon: Users, label: 'Clients', href: '/coach/client' },
  { icon: MessageSquare, label: 'Chats', href: '/dashboard/coach/chat' },
  { icon: CalendarCheck, label: 'Booked Sessions', href: '/dashboard/coach/bookedsessions' },
]

function CoachSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="none" className="w-44 min-h-screen [background:hsl(221_83%_53%)]">
      <SidebarHeader className="px-5 py-6">
        <h1 className="text-white font-bold text-xl tracking-tight">AthliyQ</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
                const isActive = pathname === href

                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-colors w-full
                        ${isActive
                          ? 'bg-white !text-blue-600 hover:bg-white hover:!text-blue-600'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <Link href={href}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CoachSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}