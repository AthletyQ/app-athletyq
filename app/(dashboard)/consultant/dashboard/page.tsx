'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, User, Video, TrendingUp, DollarSign, Calendar,
  CheckCircle, PhoneCall, MapPin,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { VideoCall } from '@/components/dashboard/VideoCall'



function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase()
}

const TZ = 'Asia/Colombo'

function formatSLTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: TZ, hour: 'numeric', minute: '2-digit',
  })
}

function formatSLDate(iso: string) {
  const d          = new Date(iso)
  const now        = new Date()
  const todaySL    = now.toLocaleDateString('en-CA', { timeZone: TZ })
  const dateSL     = d.toLocaleDateString('en-CA',   { timeZone: TZ })
  const tomorrowSL = new Date(now.getTime() + 86400000).toLocaleDateString('en-CA', { timeZone: TZ })
  const timeStr    = formatSLTime(iso)
  if (dateSL === todaySL)    return `Today, ${timeStr}`
  if (dateSL === tomorrowSL) return `Tomorrow, ${timeStr}`
  return d.toLocaleDateString('en-US', {
    timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric',
  }) + `, ${timeStr}`
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)    return 'Just now'
  if (diff < 60)   return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return 'Yesterday'
}

const MSG_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
]



function ProfileCard({ profile, consultantId }: { profile: any; consultantId: string }) {
  if (!profile) return null
  const firstName = profile.first_name ?? ''
  const lastName  = profile.last_name  ?? ''
  const specialty = profile.consultants?.specialty ?? 'General'
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-6">
      <div className="relative flex-shrink-0">
        {profile.profile_image_url ? (
          <img src={profile.profile_image_url} alt={`${firstName} ${lastName}`} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-400">{initials(`${firstName} ${lastName}`)}</span>
          </div>
        )}
        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{firstName} {lastName}</h2>
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            <TrendingUp className="w-3 h-3" />
            {specialty.toUpperCase()}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" /> Sri Lanka
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Role</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {profile.role?.replace('_', ' ') ?? 'Consultant'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Email</p>
            <p className="text-sm font-semibold text-gray-900">{profile.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Experience</p>
            <p className="text-sm font-semibold text-gray-900">
              {profile.consultants?.years_of_experience ?? '—'} yrs
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Rating</p>
            <p className="text-sm font-semibold text-gray-900">⭐ {profile.consultants?.rating ?? '—'}</p>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right">
        <p className="text-xs text-gray-400 font-medium mb-0.5">CONSULTANT ID:</p>
        <p className="text-sm font-bold tracking-widest">{consultantId.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs text-gray-400 mt-2">Wellness Professional</p>
      </div>
    </div>
  )
}



function StatCards({ stats }: { stats: any }) {
  const STATS = [
    {
      label:    'Total Clients',
      value:    String(stats?.totalClients ?? '—'),
      sub:      stats?.pendingClients > 0 ? `+${stats.pendingClients} pending` : 'No pending clients',
      subColor: stats?.pendingClients > 0 ? 'text-blue-500' : 'text-gray-400',
      icon:     Users,
    },
    {
      label:    'Sessions This Week',
      value:    String(stats?.sessionsThisWeek ?? '—'),
      sub:      stats?.sessionsToday > 0 ? `${stats.sessionsToday} today` : 'None today',
      subColor: stats?.sessionsToday > 0 ? 'text-blue-500' : 'text-gray-400',
      icon:     Calendar,
    },
    {
      label:    'This Month',
      value:    `$${stats?.monthlyEarnings ?? 0}`,
      sub:      stats?.earningsChange ?? 'No earnings yet',
      subColor: stats?.earningsChange?.startsWith('+') ? 'text-green-500'
              : stats?.earningsChange?.startsWith('-') ? 'text-red-400'
              : 'text-gray-400',
      icon:     DollarSign,
    },
    {
      label:    'Client Satisfaction',
      value:    stats?.clientSatisfaction ?? '4.9',
      sub:      'Based on reviews',
      subColor: 'text-gray-400',
      icon:     TrendingUp,
    },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {STATS.map(({ label, value, sub, subColor, icon: Icon }) => (
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
  )
}


function UpcomingSessions({ sessions, onJoin, onViewAll }: {
  sessions:  any[]
  onJoin:    (sessionId: string, durationMinutes: number) => void
  onViewAll: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">Upcoming Sessions</h2>
        <button onClick={onViewAll} className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No upcoming sessions today or tomorrow</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isOnline    = s.location_type === 'online' || s.session_type === 'online'
            const isConfirmed = s.status === 'confirmed'
            const fName       = s.athlete_profile?.first_name ?? ''
            const lName       = s.athlete_profile?.last_name  ?? ''
            const sport       = s.sport_name ?? 'General'
            return (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Video className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{fName} {lName}</p>
                  <p className="text-xs text-gray-400">{sport} • {isOnline ? 'Online' : 'In-person'}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="text-sm text-gray-700 font-medium">{formatSLDate(s.scheduled_at)}</p>
                  <p className="text-xs text-gray-400">{s.duration_minutes} min</p>
                </div>
                {isOnline && isConfirmed ? (
                  <button
                    onClick={() => onJoin(String(s.id), s.duration_minutes)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 flex-shrink-0"
                  >
                    <PhoneCall className="w-3 h-3" /> Join
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg flex-shrink-0">
                    {isOnline ? 'Pending' : 'In-person'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}



function EarningsSummary({ earnings }: { earnings: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">Earnings Summary</h2>
        <button className="text-sm text-blue-600 font-medium">Details</button>
      </div>
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Earnings (This Month)</p>
          <p className="text-2xl font-bold text-gray-900">{earnings}</p>
        </div>
        <TrendingUp className="w-8 h-8 text-green-500" />
      </div>
    </div>
  )
}



function NewMessages({ messages, onViewAll }: { messages: any[]; onViewAll: () => void }) {
  const totalUnread = messages.reduce((sum, m) => sum + (m.unread_count ?? 0), 0)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">New Messages</h2>
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
          {totalUnread > 9 ? '9+' : totalUnread}
        </span>
      </div>
      {messages.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No new messages</p>
      ) : (
        <div className="space-y-3 mb-4">
          {messages.map((msg, i) => {
            const name = `${msg.athlete?.first_name ?? ''} ${msg.athlete?.last_name ?? ''}`.trim() || 'Unknown'
            return (
              <div key={msg.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${MSG_COLORS[i % MSG_COLORS.length]}`}>
                  {initials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <p className="text-xs text-gray-400">{timeAgo(msg.last_message_at)}</p>
                      {msg.unread_count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {msg.unread_count > 9 ? '9+' : msg.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{msg.last_message ?? ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <button onClick={onViewAll} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50">
        View All Messages
      </button>
    </div>
  )
}



function AthleteActivity() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 text-base mb-4">Athlete Activity</h2>
      <div className="flex flex-col items-center justify-center h-20">
        <CheckCircle className="w-6 h-6 text-gray-200 mb-2" />
        <p className="text-xs text-gray-300">No recent activity</p>
      </div>
    </div>
  )
}



export default function ConsultantDashboard() {
  const router = useRouter()

  const [profile,      setProfile]      = useState<any>(null)
  const [stats,        setStats]        = useState<any>(null)
  const [sessions,     setSessions]     = useState<any[]>([])
  const [messages,     setMessages]     = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [consultantId, setConsultantId] = useState<string>('')
  const [activeCall,   setActiveCall]   = useState<{ sessionId: string; durationMinutes: number } | null>(null)

  const load = useCallback(async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) { setError('Not logged in.'); setLoading(false); return }

      setConsultantId(user.id)

      
      const { data: prof } = await supabase
        .from('profiles')
        .select('*, consultants(*)')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      
      const now        = new Date()
      const dayOfWeek  = now.getDay()
      const diffToMon  = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const weekStart  = new Date(now); weekStart.setDate(now.getDate() + diffToMon); weekStart.setHours(0,0,0,0)
      const weekEnd    = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999)
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
      const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthS = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthE = new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59)

      
      const [
        { data: confirmedSessions },
        { count: weekCount },
        { count: todayCount },
        { data: pendingSessions },
        { data: thisMonthPay },
        { data: lastMonthPay },
      ] = await Promise.all([
        supabase.from('sessions').select('athlete_id').eq('provider_id', user.id).eq('status', 'confirmed'),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('provider_id', user.id).eq('status', 'confirmed').gte('scheduled_at', weekStart.toISOString()).lte('scheduled_at', weekEnd.toISOString()),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('provider_id', user.id).eq('status', 'confirmed').gte('scheduled_at', todayStart.toISOString()).lte('scheduled_at', todayEnd.toISOString()),
        supabase.from('sessions').select('athlete_id').eq('provider_id', user.id).eq('status', 'pending'),
        supabase.from('payments').select('amount').eq('provider_id', user.id).gte('created_at', monthStart.toISOString()),
        supabase.from('payments').select('amount').eq('provider_id', user.id).gte('created_at', lastMonthS.toISOString()).lte('created_at', lastMonthE.toISOString()),
      ])

      const confirmedIds = new Set((confirmedSessions ?? []).map((s: any) => s.athlete_id))
      const pendingIds   = new Set((pendingSessions   ?? []).map((s: any) => s.athlete_id))
      const newPending   = [...pendingIds].filter(id => !confirmedIds.has(id)).length
      const thisMonth    = (thisMonthPay ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
      const lastMonth    = (lastMonthPay ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0)

      let earningsChange = 'No earnings yet'
      if (lastMonth === 0 && thisMonth > 0) earningsChange = 'New earnings this month'
      else if (lastMonth > 0) {
        const pct = ((thisMonth - lastMonth) / lastMonth) * 100
        earningsChange = pct >= 0 ? `+${Math.round(pct)}% vs last month` : `-${Math.abs(Math.round(pct))}% vs last month`
      }

      setStats({
        totalClients:       confirmedIds.size,
        pendingClients:     newPending,
        sessionsThisWeek:   weekCount  ?? 0,
        sessionsToday:      todayCount ?? 0,
        monthlyEarnings:    thisMonth,
        earningsChange,
        clientSatisfaction: '4.9',
      })

      
      const SL_OFFSET_MS  = 330 * 60 * 1000
      const nowInSL       = new Date(now.getTime() + SL_OFFSET_MS)
      const slY = nowInSL.getUTCFullYear(), slM = nowInSL.getUTCMonth(), slD = nowInSL.getUTCDate()
      const tomorrowEndSL = new Date(Date.UTC(slY, slM, slD + 2, 0, 0, 0, 0) - 1 - SL_OFFSET_MS)

      const { data: upcomingRaw } = await supabase
        .from('sessions')
        .select(`
          id, scheduled_at, duration_minutes, session_type, location_type, status,
          athletes!sessions_athlete_id_fkey (
            profiles!athletes_user_id_fkey (first_name, last_name)
          ),
          sports (name)
        `)
        .eq('provider_id', user.id)
        .eq('status', 'confirmed')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', tomorrowEndSL.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5)

      setSessions((upcomingRaw ?? []).map((s: any) => {
        const ath = Array.isArray(s.athletes) ? s.athletes[0] : s.athletes
        const prf = Array.isArray(ath?.profiles) ? ath.profiles[0] : ath?.profiles
        const spt = Array.isArray(s.sports) ? s.sports[0] : s.sports
        return { ...s, athlete_profile: prf, sport_name: spt?.name ?? 'General' }
      }))

      
      const { data: convData } = await supabase
        .from('conversations')
        .select('id, unread_count, athlete_id, last_message, last_message_at')
        .eq('contact_id', user.id)
        .gt('unread_count', 0)
        .order('last_message_at', { ascending: false })
        .limit(5)

      if (convData && convData.length > 0) {
        const athleteIds = convData.map((c: any) => c.athlete_id).filter(Boolean)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', athleteIds)
        const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
        setMessages(convData.map((c: any) => ({ ...c, athlete: profileMap[c.athlete_id] ?? null })))
      } else {
        setMessages([])
      }

    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCallEnd(durationSeconds: number) {
    if (!activeCall) return
    const requiredSeconds = activeCall.durationMinutes * 60 * 0.8
    try {
      await fetch(`/api/sessions/${activeCall.sessionId}/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ coachId: consultantId, durationSeconds, requiredSeconds }),
      })
      setSessions(prev => prev.filter(s => String(s.id) !== activeCall.sessionId))
    } catch (err) { console.error('Call end error:', err) }
    setActiveCall(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  )

  if (error || !consultantId) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-semibold text-red-500 mb-1">Failed to load dashboard</p>
        <p className="text-xs text-gray-400">{error ?? 'Not logged in.'}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-full bg-gray-50">

      
      {activeCall && (
        <VideoCall
          sessionId={activeCall.sessionId}
          coachId={consultantId}
          durationMinutes={activeCall.durationMinutes}
          isCoach={true}
          onEnd={handleCallEnd}
          onClose={() => setActiveCall(null)}
        />
      )}

      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome <span className="font-semibold text-gray-700">
              {profile?.first_name ?? 'Consultant'}
            </span>! Here's what's happening with your consultations today.
          </p>
        </div>

        <ProfileCard profile={profile} consultantId={consultantId} />
        <StatCards   stats={stats} />

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <UpcomingSessions
              sessions={sessions}
              onJoin={(sessionId, durationMinutes) => setActiveCall({ sessionId, durationMinutes })}
              onViewAll={() => router.push('/consultant/bookedsessions')}
            />
            <EarningsSummary earnings={`$${stats?.monthlyEarnings ?? 0}`} />
          </div>
          <div className="col-span-1">
            <NewMessages
              messages={messages}
              onViewAll={() => router.push('/consultant/chats')}
            />
            <AthleteActivity />
          </div>
        </div>
      </main>
    </div>
  )
}
