'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Search, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import { getCoachProfile, getClients, updateClientStatus } from '@/services/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const SPORT_COLORS: Record<string, string> = {
  Running:  'bg-blue-100 text-blue-600',
  Swimming: 'bg-cyan-100 text-cyan-600',
  Cycling:  'bg-orange-100 text-orange-600',
  Tennis:   'bg-yellow-100 text-yellow-700',
  Yoga:     'bg-pink-100 text-pink-600',
  Strength: 'bg-red-100 text-red-600',
}

// ─── CLIENT CARD ─────────────────────────────────────────────────────────────

function ClientCard({ client, pending = false, onAccept, onDecline }: {
  client:    any
  pending?:  boolean
  onAccept?: (id: string) => void
  onDecline?:(id: string) => void
}) {
  const router = useRouter()

  // ✅ use values directly from API
  const completedSessions = client.completedSessions ?? 0
  const progressPct       = client.progress          ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        {client.profileImageUrl ? (
          <img
            src={client.profileImageUrl}
            alt={client.name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${client.color}`}>
            {client.initials}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-gray-900">{client.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              SPORT_COLORS[client.sport] ?? 'bg-gray-100 text-gray-600'
            }`}>
              {client.sport}
            </span>
            <span className="text-xs text-gray-400">{client.level}</span>
          </div>
        </div>
      </div>

      {/* Stats — active only */}
      {!pending && (
        <>
          {/* ✅ 3 stat boxes: Total, Upcoming, Completed */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-lg font-bold text-gray-900">{client.totalSessions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Upcoming</p>
              <p className="text-lg font-bold text-blue-600">{client.upcoming}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Completed</p>
              <p className="text-lg font-bold text-green-600">{completedSessions}</p>
            </div>
          </div>

          {/* ✅ progress bar = completed / total */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500">Session Progress</p>
              <p className="text-xs font-semibold text-blue-600">{progressPct}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {completedSessions} of {client.totalSessions} sessions completed
            </p>
          </div>
        </>
      )}

      {/* Pending info */}
      {pending && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
          <p className="text-xs text-amber-700 font-medium">Awaiting your confirmation</p>
          <p className="text-xs text-amber-500 mt-0.5">
            {client.totalSessions} session{client.totalSessions !== 1 ? 's' : ''} requested
          </p>
        </div>
      )}

      {/* Last active */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />{client.lastActive}
        </span>
        <span>Joined {client.joined}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {pending ? (
          <>
            <button
              onClick={() => onAccept?.(client.id)}
              className="flex-1 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={() => onDecline?.(client.id)}
              className="flex-1 py-2 border border-red-200 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> Decline
            </button>
          </>
        ) : (
          <>
            <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
              View Details
            </button>
            {/* ✅ navigates to chats page */}
            <button
              onClick={() => router.push('/coach/chat')}
              className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [activeTab,   setActiveTab]   = useState<'active' | 'pending'>('active')
  const [search,      setSearch]      = useState('')
  const [activeList,  setActiveList]  = useState<any[]>([])
  const [pendingList, setPendingList] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [coachId,     setCoachId]     = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { setError('Not logged in.'); return }
        const profileData = await getCoachProfile(user.id)
        if (!profileData || profileData.error) { setError('No coach profile found.'); return }
        setCoachId(profileData.id)
      } catch (err: any) {
        setError(err.message ?? 'Failed to load profile.')
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (!coachId) return
    setLoading(true)
    Promise.allSettled([
      getClients(coachId, 'active'),
      getClients(coachId, 'pending'),
    ]).then(([activeResult, pendingResult]) => {
      setActiveList( activeResult.status  === 'fulfilled' ? activeResult.value  : [])
      setPendingList(pendingResult.status === 'fulfilled' ? pendingResult.value : [])
    }).finally(() => setLoading(false))
  }, [coachId])

  const currentList = activeTab === 'active' ? activeList : pendingList
  const filtered    = currentList.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.sport.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAccept(clientId: string) {
    try {
      await updateClientStatus(clientId, 'accept')
      const client = pendingList.find(c => c.id === clientId)
      if (client) {
        setPendingList(prev => prev.filter(c => c.id !== clientId))
        setActiveList(prev => [...prev, { ...client, lastActive: 'Just accepted' }])
      }
    } catch (err) { console.error('Accept failed:', err) }
  }

  async function handleDecline(clientId: string) {
    try {
      await updateClientStatus(clientId, 'decline')
      setPendingList(prev => prev.filter(c => c.id !== clientId))
    } catch (err) { console.error('Decline failed:', err) }
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <main className="flex-1 p-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your athletes and view their progress.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-5">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'active'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            Active Clients ({activeList.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'pending'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            Pending Clients ({pendingList.length})
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
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Content */}
        {!coachId && !error ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
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
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-sm font-medium text-gray-400">No {activeTab} clients found</p>
            <p className="text-xs text-gray-300 mt-1">
              {activeTab === 'pending'
                ? 'New session requests will appear here'
                : 'Confirmed clients will appear here'}
            </p>
          </div>
        )}

      </main>
    </div>
  )
}