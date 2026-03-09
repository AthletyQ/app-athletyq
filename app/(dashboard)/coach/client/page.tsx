'use client'

import { useState, useEffect } from 'react'
import { Bell, User, Search, Clock } from 'lucide-react'
import { getClients, updateClientStatus } from '@/services/api'

const COACH_USER_ID = 'your-user-id-here'

const SPORT_COLORS: Record<string, string> = {
  Running:  'bg-blue-100 text-blue-600',
  Swimming: 'bg-cyan-100 text-cyan-600',
  Cycling:  'bg-orange-100 text-orange-600',
  Tennis:   'bg-yellow-100 text-yellow-700',
  Yoga:     'bg-pink-100 text-pink-600',
}

function Topbar() {
  return (
    <header className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-b border-gray-100">
      <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
        <Bell className="w-4 h-4" />
      </button>
      <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
        <User className="w-4 h-4" />
      </button>
    </header>
  )
}

function ClientCard({ client, pending = false, onAccept, onDecline }: {
  client: any
  pending?: boolean
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500">Progress</p>
              <p className="text-xs font-semibold text-blue-600">{client.progress}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${client.progress}%` }} />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />{client.lastActive}
        </span>
        {!pending && <span>Joined {client.joined}</span>}
      </div>

      <div className="flex gap-2">
        {pending ? (
          <>
            <button
              onClick={() => onAccept?.(client.id)}
              className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline?.(client.id)}
              className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
            >
              Decline
            </button>
          </>
        ) : (
          <>
            <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
              View Details
            </button>
            <button className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50">
              Message
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [activeTab,  setActiveTab]  = useState<'active' | 'pending'>('active')
  const [search,     setSearch]     = useState('')
  const [clients,    setClients]    = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [coachId,    setCoachId]    = useState<string | null>(null)

  // fetch coach id first
  useEffect(() => {
    fetch(`/api/coach/profile?userId=${COACH_USER_ID}`)
      .then(r => r.json())
      .then(p => setCoachId(p.id))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!coachId) return
    setLoading(true)
    getClients(coachId, activeTab)
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [coachId, activeTab])

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sport.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAccept(clientId: string) {
    await updateClientStatus(clientId, 'accept')
    setClients(prev => prev.filter(c => c.id !== clientId))
  }

  async function handleDecline(clientId: string) {
    await updateClientStatus(clientId, 'decline')
    setClients(prev => prev.filter(c => c.id !== clientId))
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Topbar />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your athletes and view their progress.</p>
        </div>

        <div className="flex gap-6 border-b border-gray-200 mb-5">
          {(['active', 'pending'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors capitalize ${
                activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tab === 'active' ? 'Active' : 'Pending'} Clients ({clients.length})
            </button>
          ))}
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading...</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                pending={activeTab === 'pending'}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No clients found.
          </div>
        )}
      </main>
    </div>
  )
}