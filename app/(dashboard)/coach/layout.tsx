'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, MessageSquare, CalendarCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/coach/dashboard' },
  { icon: Users, label: 'Clients', href: '/coach/client' },
  { icon: MessageSquare, label: 'Chats', href: '/coach/chat' },
  { icon: CalendarCheck, label: 'Booked Sessions', href: '/coach/bookedsessions' },
]

function CoachSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-44 h-screen sticky top-0 bg-blue-600 flex flex-col flex-shrink-0">
      <div className="px-5 py-6">
        <h1 className="text-white font-bold text-xl tracking-tight">AthletyQ</h1>
      </div>
      <nav className="flex flex-col gap-1 px-3 mt-1">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${isActive
                ? 'bg-white text-blue-600'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <CoachSidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  )
}