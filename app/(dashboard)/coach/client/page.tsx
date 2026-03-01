'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Users, MessageSquare, CalendarCheck,
  Bell, User, Search, Clock,
} from 'lucide-react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Users, label: 'Clients' },
  { icon: MessageSquare, label: 'Chats' },
  { icon: CalendarCheck, label: 'Booked Sessions' },
]

const ACTIVE_CLIENTS = [
  {
    initials: 'SJ',
    name: 'Sarah Johnson',
    sport: 'Running',
    level: 'Intermediate',
    totalSessions: 24,
    upcoming: 2,
    progress: 85,
    lastActive: '2 days ago',
    joined: 'Jan 2025',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    initials: 'MC',
    name: 'Michael Chen',
    sport: 'Swimming',
    level: 'Advanced',
    totalSessions: 48,
    upcoming: 1,
    progress: 92,
    lastActive: 'Yesterday',
    joined: 'Dec 2024',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    initials: 'ER',
    name: 'Emma Rodriguez',
    sport: 'Cycling',
    level: 'Beginner',
    totalSessions: 12,
    upcoming: 3,
    progress: 68,
    lastActive: '5 days ago',
    joined: 'Feb 2025',
    color: 'bg-purple-100 text-purple-700',
  },
]

const PENDING_CLIENTS = [
  {
    initials: 'JW',
    name: 'James Wilson',
    sport: 'Tennis',
    level: 'Intermediate',
    totalSessions: 0,
    upcoming: 0,
    progress: 0,
    lastActive: 'Requested today',
    joined: '—',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    initials: 'LP',
    name: 'Lily Park',
    sport: 'Yoga',
    level: 'Beginner',
    totalSessions: 0,
    upcoming: 0,
    progress: 0,
    lastActive: 'Requested yesterday',
    joined: '—',
    color: 'bg-rose-100 text-rose-700',
  },
]

const SPORT_COLORS: Record<string, string> = {
  Running: 'bg-blue-100 text-blue-600',
  Swimming: 'bg-cyan-100 text-cyan-600',
  Cycling: 'bg-orange-100 text-orange-600',
  Tennis: 'bg-yellow-100 text-yellow-700',
  Yoga: 'bg-pink-100 text-pink-600',
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Sidebar({ activeNav, setActiveNav }: { activeNav: string; setActiveNav: (l: string) => void }) {
  return (
    <aside className="w-44 min-h-screen bg-blue-600 flex flex-col flex-shrink-0">
      <div className="px-5 py-6">
        <h1 className="text-white font-bold text-xl tracking-tight">AthliyQ</h1>
      </div>
      <nav className="flex flex-col gap-1 px-3 mt-1">
        {NAV_ITEMS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setActiveNav(label)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
              activeNav === label
                ? 'bg-white text-blue-600'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-b border-gray-100">
      <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
        <Bell className="w-4 h-4" />
      </button>
      <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
        <User className="w-4 h-4" />
      </button>
    </header>
  )
}

type Client = typeof ACTIVE_CLIENTS[0]

function ClientCard({ client, pending = false }: { client: Client; pending?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${client.color}`}>
          {client.initials}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{client.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SPORT_COLORS[client.sport] ?? 'bg-gray-100 text-gray-600'}`}>
              {client.sport}
            </span>
            <span className="text-xs text-gray-400">{client.level}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!pending && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Total Sessions</p>
              <p className="text-lg font-bold text-gray-900">{client.totalSessions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Upcoming</p>
              <p className="text-lg font-bold text-gray-900">{client.upcoming}</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500">Progress</p>
              <p className="text-xs font-semibold text-blue-600">{client.progress}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${client.progress}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {client.lastActive}
        </span>
        {!pending && <span>Joined {client.joined}</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {pending ? (
          <>
            <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Accept
            </button>
            <button className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Decline
            </button>
          </>
        ) : (
          <>
            <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              View Details
            </button>
            <button className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Message
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [activeNav, setActiveNav] = useState('Clients')
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')
  const [search, setSearch] = useState('')

  const clients = activeTab === 'active' ? ACTIVE_CLIENTS : PENDING_CLIENTS
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sport.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your athletes and view their progress.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-200 mb-5">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'active'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              Active Clients ({ACTIVE_CLIENTS.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              Pending Requests ({PENDING_CLIENTS.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name or sport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </div>

          {/* Client Cards Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {filtered.map((client) => (
                <ClientCard key={client.name} client={client} pending={activeTab === 'pending'} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No clients found.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
