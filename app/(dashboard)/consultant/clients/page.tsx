'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'



const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
]

const SPORT_COLORS: Record<string, string> = {
  Running:   'bg-blue-100 text-blue-600',
  Swimming:  'bg-cyan-100 text-cyan-600',
  Cycling:   'bg-orange-100 text-orange-600',
  Tennis:    'bg-yellow-100 text-yellow-700',
  Yoga:      'bg-pink-100 text-pink-600',
  Strength:  'bg-red-100 text-red-600',
  Nutrition: 'bg-green-100 text-green-600',
  Wellness:  'bg-teal-100 text-teal-600',
  Fitness:   'bg-indigo-100 text-indigo-600',
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}


function ClientCard({ client, pending = false, consultantUserId, onAccept, onDecline }: {
  client:           any
  pending?:         boolean
  consultantUserId: string
  onAccept?:        (userId: string) => void
  onDecline?:       (userId: string) => void
}) {
  const router = useRouter()

  const [messaging, setMessaging] = useState(false)
  const [msgError,  setMsgError]  = useState<string | null>(null)

  const firstName         = client.profiles?.first_name ?? ''
  const lastName          = client.profiles?.last_name  ?? ''
  const sport             = client.sports?.name         ?? 'General'
  const completedSessions = client.completedSessions    ?? 0
  const totalSessions     = client.totalSessions        ?? 0
  const upcomingSessions  = client.upcomingSessions     ?? 0
  const progressPct       = totalSessions > 0
    ? Math.round((completedSessions / totalSessions) * 100)
    : 0

  async function handleMessage() {
    setMsgError(null)
    if (!consultantUserId) { setMsgError('Not logged in.'); return }
    if (!client.user_id)   { setMsgError('Athlete ID missing.'); return }

    setMessaging(true)
    try {
      const res  = await fetch('/api/messages/conversations/find-or-create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          coachUserId:   consultantUserId,
          athleteUserId: client.user_id,
        }),
      })
      const text = await res.text()
      if (!res.ok) { setMsgError(`Server error ${res.status}`); return }

      let data: any
      try { data = JSON.parse(text) } catch { setMsgError('Unexpected server response'); return }
      if (!data.conversationId) { setMsgError('No conversation ID returned'); return }

      router.push(`/consultant/chats?conversationId=${data.conversationId}`)
    } catch {
      setMsgError('Network error — please try again')
    } finally {
      setMessaging(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

     
      <div className="flex items-center gap-3">
        {client.profiles?.profile_image_url ? (
          <img
            src={client.profiles.profile_image_url}
            alt={`${firstName} ${lastName}`}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(firstName || 'A')}`}>
            {initials(firstName, lastName)}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-gray-900">{firstName} {lastName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SPORT_COLORS[sport] ?? 'bg-gray-100 text-gray-600'}`}>
              {sport}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {client.profiles?.role?.replace('_', ' ') ?? 'Athlete'}
            </span>
          </div>
        </div>
      </div>

      
      {!pending && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-lg font-bold text-gray-900">{totalSessions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Upcoming</p>
              <p className="text-lg font-bold text-blue-600">{upcomingSessions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Completed</p>
              <p className="text-lg font-bold text-green-600">{completedSessions}</p>
            </div>
          </div>

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
              {completedSessions} of {totalSessions} sessions completed
            </p>
          </div>
        </>
      )}

      
      {pending && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
          <p className="text-xs text-amber-700 font-medium">Awaiting your confirmation</p>
          <p className="text-xs text-amber-500 mt-0.5">
            {client.pendingSessions ?? 1} session{(client.pendingSessions ?? 1) !== 1 ? 's' : ''} requested
          </p>
        </div>
      )}

      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Recently active
        </span>
        <span>Joined {client.created_at ? formatDate(client.created_at) : '—'}</span>
      </div>

      
      {msgError && <p className="text-xs text-red-500 text-center">{msgError}</p>}

      
      <div className="flex gap-2">
        {pending ? (
          <>
            <button
              onClick={() => onAccept?.(client.user_id)}
              className="flex-1 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={() => onDecline?.(client.user_id)}
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
            <button
              onClick={handleMessage}
              disabled={messaging}
              className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 disabled:opacity-60"
            >
              {messaging
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><MessageSquare className="w-3.5 h-3.5" /> Message</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}



export default function ConsultantClientsPage() {
  const [activeTab,        setActiveTab]        = useState<'active' | 'pending'>('active')
  const [search,           setSearch]           = useState('')
  const [clients,          setClients]          = useState<any[]>([])
  const [enriched,         setEnriched]         = useState<any[]>([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState<string | null>(null)
  const [consultantUserId, setConsultantUserId] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setConsultantUserId(data.user.id)
      else { setError('Not logged in.'); setLoading(false) }
    })
  }, [])

  useEffect(() => {
    if (!consultantUserId) return
    setLoading(true)
    fetch(`/api/consultant/clients?consultant_id=${consultantUserId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) setClients(result.data.clients ?? [])
        else setError(result.error?.message ?? 'Failed to load clients.')
      })
      .catch((err) => setError(err.message ?? 'Network error'))
      .finally(() => setLoading(false))
  }, [consultantUserId])


  useEffect(() => {
    if (!clients.length || !consultantUserId) {
      setEnriched(clients)
      return
    }

    async function fetchConfirmedCounts() {
      const athleteIds = clients.map((c) => c.user_id).filter(Boolean)
      if (!athleteIds.length) { setEnriched(clients); return }

      const { data } = await supabase
        .from('sessions')
        .select('athlete_id')
        .eq('provider_id', consultantUserId)
        .eq('status', 'confirmed')
        .in('athlete_id', athleteIds)

     
      const confirmedSet = new Set((data ?? []).map((s: any) => s.athlete_id))

      setEnriched(clients.map((c) => ({
        ...c,
        hasConfirmedSession: confirmedSet.has(c.user_id),
      })))
    }

    fetchConfirmedCounts()
  }, [clients, consultantUserId])

  
  const activeList  = enriched.filter((c) => c.hasConfirmedSession === true)
  const pendingList = enriched.filter((c) => c.hasConfirmedSession === false)

  const currentList = activeTab === 'active' ? activeList : pendingList
  const filtered    = currentList.filter((c) => {
    const name  = `${c.profiles?.first_name ?? ''} ${c.profiles?.last_name ?? ''}`.toLowerCase()
    const sport = (c.sports?.name ?? '').toLowerCase()
    return name.includes(search.toLowerCase()) || sport.includes(search.toLowerCase())
  })

  function handleAccept(userId: string) {

    setEnriched(prev => prev.map(c =>
      c.user_id === userId ? { ...c, hasConfirmedSession: true } : c
    ))
  }

  function handleDecline(userId: string) {
    setEnriched(prev => prev.filter(c => c.user_id !== userId))
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
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
              className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tab === 'active'
                ? `Active Clients (${activeList.length})`
                : `Pending Clients (${pendingList.length})`}
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
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map((client) => (
              <ClientCard
                key={client.user_id}
                client={client}
                pending={activeTab === 'pending'}
                consultantUserId={consultantUserId}
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
