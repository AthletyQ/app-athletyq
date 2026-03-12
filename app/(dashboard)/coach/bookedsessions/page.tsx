'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Bell, User, Video, MapPin, Clock, ChevronLeft, ChevronRight,
  Filter, MoreVertical, CheckCircle, XCircle, AlertCircle, CalendarCheck,
} from 'lucide-react'
import { getCoachProfile, getBookedSessions } from '@/services/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

type SessionStatus = 'confirmed' | 'pending' | 'cancelled'

type Session = {
  id:        string
  client:    string
  initials:  string
  color:     string
  sport:     string
  sportColor:string
  mode:      'Online' | 'In-person'
  location:  string
  date:      string
  time:      string
  duration:  string
  status:    SessionStatus
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getMondayOfWeek(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(monday: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return {
      full:    formatDate(date),
      short:   date.toLocaleDateString('en-US', { weekday: 'short' }),
      date:    String(date.getDate()),
      isToday: date.toDateString() === today.toDateString(),
    }
  })
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; classes: string; icon: typeof CheckCircle }> = {
  confirmed: { label: 'Confirmed', classes: 'bg-green-50 text-green-600', icon: CheckCircle },
  pending:   { label: 'Pending',   classes: 'bg-amber-50 text-amber-600', icon: AlertCircle },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-500',     icon: XCircle     },
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

function Topbar() {
  return (
    <header className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
      <button className="relative w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
      </button>
      <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
        <User className="w-4 h-4" />
      </button>
    </header>
  )
}

// ─── WEEK STRIP ───────────────────────────────────────────────────────────────

function WeekStrip({
  activeDay, setActiveDay, weekOffset, setWeekOffset, sessions,
}: {
  activeDay:    string
  setActiveDay: (d: string) => void
  weekOffset:   number
  setWeekOffset:(n: number) => void
  sessions:     Session[]
}) {
  const monday = useMemo(() => {
    const base = getMondayOfWeek(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset])

  const week       = useMemo(() => getWeekDays(monday), [monday])
  const monthLabel = monday.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-gray-500">{monthLabel}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-2 h-7 rounded-full text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1">
        {week.map((day) => {
          const isActive    = activeDay === day.full
          const hasSessions = sessions.some((s) => s.date === day.full)
          return (
            <button
              key={day.full}
              onClick={() => setActiveDay(day.full)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-colors ${
                isActive ? 'bg-blue-600' : day.isToday ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`text-xs font-medium mb-1 ${
                isActive ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {day.short}
              </span>
              <span className={`text-sm font-bold ${
                isActive ? 'text-white' : day.isToday ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {day.date}
              </span>
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${
                hasSessions
                  ? isActive ? 'bg-blue-200' : 'bg-blue-400'
                  : 'bg-transparent'
              }`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── SESSION CARD ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: Session }) {
  const { label, classes, icon: StatusIcon } = STATUS_CONFIG[session.status]

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow ${
      session.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${session.color}`}>
            {session.initials}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{session.client}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${session.sportColor}`}>
              {session.sport}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${classes}`}>
            <StatusIcon className="w-3 h-3" />{label}
          </span>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>{session.time} · {session.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {session.mode === 'Online'
            ? <Video className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            : <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
          <span className="truncate">{session.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          session.mode === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {session.mode}
        </span>
        <div className="flex gap-2">
          {session.status !== 'cancelled' && (
            <>
              {session.mode === 'Online' && session.status === 'confirmed' && (
                <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                  Join
                </button>
              )}
              <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                Reschedule
              </button>
            </>
          )}
          {session.status === 'cancelled' && (
            <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
              Rebook
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function BookedSessionsPage() {
  const [sessions,     setSessions]     = useState<Session[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [activeDay,    setActiveDay]    = useState(formatDate(new Date()))
  const [weekOffset,   setWeekOffset]   = useState(0)
  const [filterStatus, setFilterStatus] = useState<'all' | SessionStatus>('all')

  useEffect(() => {
    async function load() {
      try {
        // ✅ Step 1 — get logged in user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setError('Not logged in. Please sign in to continue.')
          setLoading(false)
          return
        }

        // ✅ Step 2 — get coach profile for logged in user
        const profileData = await getCoachProfile(user.id)

        if (!profileData || profileData.error) {
          setError('No coach profile found for this account.')
          setLoading(false)
          return
        }

        // ✅ Step 3 — fetch sessions for this coach
        const data = await getBookedSessions(profileData.id)
        setSessions(Array.isArray(data) ? data : [])

      } catch (err: any) {
        console.error('BookedSessions load error:', err)
        setError(err.message ?? 'Failed to load sessions.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const daySessions    = sessions.filter((s) => s.date === activeDay)
  const filtered       = filterStatus === 'all'
    ? daySessions
    : daySessions.filter((s) => s.status === filterStatus)

  const totalAll       = sessions.length
  const totalConfirmed = sessions.filter((s) => s.status === 'confirmed').length
  const totalPending   = sessions.filter((s) => s.status === 'pending').length

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booked Sessions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and track all your coaching sessions.</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Total Sessions', value: totalAll,       color: 'text-gray-900'  },
            { label: 'Confirmed',      value: totalConfirmed, color: 'text-green-600' },
            { label: 'Pending',        value: totalPending,   color: 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            </div>
          ))}
        </div>

        {/* Week Strip */}
        <WeekStrip
          activeDay={activeDay}
          setActiveDay={setActiveDay}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          sessions={sessions}
        />

        {/* Filter Row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">
            {activeDay} —{' '}
            <span className="text-gray-400 font-normal">
              {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading sessions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
            <div className="text-center">
              <CalendarCheck className="w-10 h-10 text-red-200 mb-3 mx-auto" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CalendarCheck className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-medium">No sessions for this day</p>
            <p className="text-xs text-gray-300 mt-1">Select another day to view sessions</p>
          </div>
        )}

      </main>
    </div>
  )
}