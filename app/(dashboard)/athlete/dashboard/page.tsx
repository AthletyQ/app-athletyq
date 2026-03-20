'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import {
  Calendar, Users, MessageSquare, Dumbbell,
  ChevronRight, Clock, MapPin, Video, Activity,
  Target, TrendingUp, Zap, Heart,
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

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1']
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
  if (isToday) return `Today · ${timeStr}`
  if (isTomorrow) return `Tomorrow · ${timeStr}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${timeStr}`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
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

    // Profile + athlete details
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

    // Upcoming sessions
    const { data: sessData } = await supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, status, location_type, provider_type, price, provider_id')
      .eq('athlete_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5)

    if (sessData && sessData.length > 0) {
      // Fetch provider names
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

      // Unique providers for "My Team" section
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

    // Conversations
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
          <p className="text-sm text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, <span className="font-semibold text-gray-700">{profile?.first_name} {profile?.last_name}</span>! Here's your performance overview.
        </p>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColor(profile?.id ?? '') }}
          >
            {initials(profile?.first_name ?? '', profile?.last_name ?? '')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </h2>
              {profile?.preferred_sport && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">
                  🏅 {profile.preferred_sport}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-6 mt-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Email</p>
                <p className="text-sm text-gray-700 mt-0.5">{profile?.email}</p>
              </div>
              {profile?.age && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Age</p>
                  <p className="text-sm text-gray-700 mt-0.5">{profile.age} yrs</p>
                </div>
              )}
              {profile?.height_cm && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Height</p>
                  <p className="text-sm text-gray-700 mt-0.5">{profile.height_cm} cm</p>
                </div>
              )}
              {profile?.weight_kg && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Weight</p>
                  <p className="text-sm text-gray-700 mt-0.5">{profile.weight_kg} kg</p>
                </div>
              )}
            </div>

            {/* Goals & Injuries */}
            <div className="flex flex-wrap gap-4 mt-3">
              {profile?.goals && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-gray-500">Goal:</span>
                  <span className="text-xs text-gray-700">{profile.goals}</span>
                </div>
              )}
              {profile?.injuries && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Heart className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-medium text-gray-500">Injury:</span>
                  <span className="text-xs text-gray-700">{profile.injuries}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Athlete ID badge ── */}
          {profile?.id && (
            <div className="flex-shrink-0 bg-gray-900 text-white rounded-2xl px-5 py-4 text-center min-w-[140px]">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-1">
                Athlete ID
              </p>
              <p className="text-lg font-bold tracking-wide font-mono">
                {profile.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {upcomingCount} session{upcomingCount !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Upcoming Sessions"
          value={upcomingCount}
          sub={upcomingCount === 0 ? 'No sessions booked' : 'sessions scheduled'}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Dumbbell}
          label="My Coaches"
          value={coachCount}
          sub={coachCount === 0 ? 'Find a coach' : 'active coaches'}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Users}
          label="Consultants"
          value={consultantCount}
          sub={consultantCount === 0 ? 'Find a consultant' : 'active consultants'}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={MessageSquare}
          label="New Messages"
          value={totalUnread}
          sub={totalUnread === 0 ? 'All caught up!' : 'unread messages'}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Upcoming Sessions (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">Upcoming Sessions</h3>
              <button
                onClick={() => router.push('/athlete/coaches')}
                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                Book More <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No upcoming sessions</p>
                <button
                  onClick={() => router.push('/athlete/coaches')}
                  className="text-xs text-blue-600 font-medium border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  Find a Coach or Consultant
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 px-6 py-4">
                    {/* Provider avatar */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(session.provider?.first_name ?? '') }}
                    >
                      {initials(session.provider?.first_name ?? '', session.provider?.last_name ?? '')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {session.provider?.first_name} {session.provider?.last_name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{session.provider_type}</span>
                        <span className="text-gray-200">·</span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {session.duration_minutes} min
                        </div>
                        <span className="text-gray-200">·</span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          {session.location_type === 'online'
                            ? <Video className="w-3 h-3" />
                            : <MapPin className="w-3 h-3" />
                          }
                          <span className="capitalize">{session.location_type?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-600">{formatTime(session.scheduled_at)}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
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

          {/* My Team (coaches + consultants from sessions) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">My Team</h3>
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
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Zap className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">No team members yet</p>
                <p className="text-xs text-gray-300">Book a session to add coaches and consultants</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4">
                {providers.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(p.id) }}
                    >
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

        {/* Right: Messages + Activity (1/3 width) */}
        <div className="space-y-6">

          {/* Messages */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">Messages</h3>
              {totalUnread > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>

            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <MessageSquare className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => router.push('/athlete/chats')}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(conv.contact?.first_name ?? '') }}
                    >
                      {initials(conv.contact?.first_name ?? '', conv.contact?.last_name ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {conv.contact?.first_name} {conv.contact?.last_name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {conv.last_message ?? 'No messages yet'}
                      </p>
                    </div>
                    {(conv.unread_count ?? 0) > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-gray-50">
              <button
                onClick={() => router.push('/athlete/chats')}
                className="w-full text-xs text-gray-500 font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                View All Messages
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {[
                {
                  icon: Activity,
                  label: 'Total Sessions',
                  value: sessions.length,
                  color: 'text-blue-500',
                  bg: 'bg-blue-50',
                },
                {
                  icon: TrendingUp,
                  label: 'Coaches & Consultants',
                  value: providers.length,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-50',
                },
                {
                  icon: MessageSquare,
                  label: 'Active Conversations',
                  value: conversations.length,
                  color: 'text-amber-500',
                  bg: 'bg-amber-50',
                },
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
    </div>
  )
}