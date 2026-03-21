'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import {
  Calendar, Users, MessageSquare, Dumbbell,
  ChevronRight, Activity, Target, TrendingUp, Zap, Heart,
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface AthleteProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  preferred_sport: string | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  goals: string | null
  injuries: string | null
}

interface Session {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  location_type: string
  provider_type: string
  price: number
  provider: { first_name: string; last_name: string } | null
}

interface Conversation {
  id: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  contact: { first_name: string; last_name: string; role: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
]
function avatarColor(str: string) {
  return AVATAR_COLORS[(str?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}
function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}
function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString()
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today, ${timeStr}`
  if (isTomorrow) return `Tomorrow, ${timeStr}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AthleteDashboard() {
  const router = useRouter()
  const [profile,       setProfile]       = useState<AthleteProfile | null>(null)
  const [sessions,      setSessions]      = useState<Session[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [providers,     setProviders]     = useState<{ id: string; first_name: string; last_name: string; type: string }[]>([])
  const [loading,       setLoading]       = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data: prof }, { data: ath }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email').eq('id', user.id).single(),
      supabase.from('athletes').select('age, height_cm, weight_kg, goals, injuries, sports(name)').eq('user_id', user.id).single(),
    ])

    if (prof) {
      setProfile({
        id: prof.id,
        first_name: prof.first_name,
        last_name: prof.last_name,
        email: prof.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        preferred_sport: (ath as any)?.sports?.name ?? null,
        age: ath?.age ?? null,
        height_cm: ath?.height_cm ?? null,
        weight_kg: ath?.weight_kg ?? null,
        goals: ath?.goals ?? null,
        injuries: ath?.injuries ?? null,
      })
    }

    const { data: sessData } = await supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, status, location_type, provider_type, price, provider_id')
      .eq('athlete_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5)

    if (sessData && sessData.length > 0) {
      const providerIds = [...new Set(sessData.map((s) => s.provider_id))]
      const { data: provProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', providerIds)

      const provMap = new Map((provProfiles ?? []).map((p) => [p.id, p]))

      setSessions(sessData.map((s) => ({
        ...s,
        provider: provMap.get(s.provider_id) ?? null,
      })))

      const uniqueProviders = sessData
        .map((s) => ({
          id:         s.provider_id,
          first_name: provMap.get(s.provider_id)?.first_name ?? '',
          last_name:  provMap.get(s.provider_id)?.last_name  ?? '',
          type:       s.provider_type,
        }))
        .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)

      setProviders(uniqueProviders)
    }

    const { data: convData } = await supabase
      .from('conversations')
      .select(`
        id, last_message, last_message_at, unread_count,
        contact:profiles!conversations_contact_id_fkey (
          first_name, last_name, role
        )
      `)
      .eq('athlete_id', user.id)
      .order('last_message_at', { ascending: false })
      .limit(4)

    if (convData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setConversations(convData.map((c: any) => ({
        ...c,
        contact: Array.isArray(c.contact) ? c.contact[0] ?? null : c.contact,
      })))
    }

    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const totalUnread     = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0)
  const upcomingCount   = sessions.length
  const coachCount      = providers.filter((p) => p.type === 'coach').length
  const consultantCount = providers.filter((p) => p.type === 'consultant').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Upcoming Sessions',
      value: upcomingCount,
      sub: upcomingCount === 0 ? 'No sessions booked' : 'sessions scheduled',
      subColor: upcomingCount === 0 ? 'text-gray-400' : 'text-blue-500',
      icon: Calendar,
    },
    {
      label: 'My Coaches',
      value: coachCount,
      sub: coachCount === 0 ? 'Find a coach' : 'active coaches',
      subColor: coachCount === 0 ? 'text-gray-400' : 'text-blue-500',
      icon: Dumbbell,
    },
    {
      label: 'Consultants',
      value: consultantCount,
      sub: consultantCount === 0 ? 'Find a consultant' : 'active consultants',
      subColor: consultantCount === 0 ? 'text-gray-400' : 'text-blue-500',
      icon: Users,
    },
    {
      label: 'New Messages',
      value: totalUnread,
      sub: totalUnread === 0 ? 'All caught up!' : 'unread messages',
      subColor: totalUnread === 0 ? 'text-gray-400' : 'text-amber-500',
      icon: MessageSquare,
    },
  ]

  // Layout already provides bg-gray-50 + padding — no wrapper needed here
  return (
    <>
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome back,{' '}
          <span className="font-semibold text-gray-700">
            {profile?.first_name} {profile?.last_name}
          </span>! Here's your performance overview.
        </p>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor(profile?.first_name ?? '')}`}>
            {initials(profile?.first_name ?? '', profile?.last_name ?? '')}
          </div>
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {profile?.first_name} {profile?.last_name}
          </h2>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {profile?.preferred_sport && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                🏅 {profile.preferred_sport}
              </span>
            )}
            {profile?.goals && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Target className="w-3 h-3" /> {profile.goals}
              </span>
            )}
            {profile?.injuries && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Heart className="w-3 h-3 text-red-400" /> {profile.injuries}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Email</p>
              <p className="text-sm font-semibold text-gray-900">{profile?.email || '—'}</p>
            </div>
            {profile?.age && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Age</p>
                <p className="text-sm font-semibold text-gray-900">{profile.age} yrs</p>
              </div>
            )}
            {profile?.height_cm && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Height</p>
                <p className="text-sm font-semibold text-gray-900">{profile.height_cm} cm</p>
              </div>
            )}
            {profile?.weight_kg && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Weight</p>
                <p className="text-sm font-semibold text-gray-900">{profile.weight_kg} kg</p>
              </div>
            )}
          </div>
        </div>

        {profile?.id && (
          <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-gray-400 font-medium mb-0.5 tracking-widest uppercase">Athlete ID:</p>
            <p className="text-sm font-bold tracking-widest">{profile.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-400 mt-2">{upcomingCount} session{upcomingCount !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, sub, subColor, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <Icon className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            <p className={`text-xs font-medium ${subColor}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left col (2/3) */}
        <div className="col-span-2 space-y-5">

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base">Upcoming Sessions</h2>
              <button
                onClick={() => router.push('/athlete/coaches')}
                className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
              >
                Book More <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No upcoming sessions</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(session.provider?.first_name ?? '')}`}>
                      {initials(session.provider?.first_name ?? '', session.provider?.last_name ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {session.provider?.first_name} {session.provider?.last_name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">
                        {session.provider_type} &bull;{' '}
                        {session.location_type === 'online' ? 'Online' : 'In-person'} &bull;{' '}
                        {session.duration_minutes} min
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-700">{formatTime(session.scheduled_at)}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        session.status === 'confirmed'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Team */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base">My Team</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/athlete/coaches')}
                  className="text-xs text-blue-600 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                >
                  + Coach
                </button>
                <button
                  onClick={() => router.push('/athlete/consultants')}
                  className="text-xs text-purple-600 font-medium border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50"
                >
                  + Consultant
                </button>
              </div>
            </div>
            {providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Zap className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">No team members yet</p>
                <p className="text-xs text-gray-300">Book a session to add coaches and consultants</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(p.id)}`}>
                      {initials(p.first_name, p.last_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full ${
                        p.type === 'coach'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}>
                        {p.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col (1/3) */}
        <div className="col-span-1 space-y-4">

          {/* New Messages */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base">New Messages</h2>
              {totalUnread > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
            <div className="space-y-1 mb-4">
              {conversations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No new messages</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => router.push('/athlete/chats')}
                    className="w-full flex gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer text-left transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(conv.contact?.first_name ?? '')}`}>
                      {initials(conv.contact?.first_name ?? '', conv.contact?.last_name ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {conv.contact?.first_name} {conv.contact?.last_name}
                        </p>
                        {(conv.unread_count ?? 0) > 0 && (
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 ml-2">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.last_message ?? 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => router.push('/athlete/chats')}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              View All Messages
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 text-base mb-4">Quick Stats</h2>
            <div className="space-y-3">
              {[
                { icon: Activity,      label: 'Total Sessions',        value: sessions.length,      color: 'text-blue-500',  bg: 'bg-blue-50'  },
                { icon: TrendingUp,    label: 'Coaches & Consultants', value: providers.length,     color: 'text-green-500', bg: 'bg-green-50' },
                { icon: MessageSquare, label: 'Active Conversations',  value: conversations.length, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}