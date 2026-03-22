'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Video, MapPin, Clock, ChevronLeft, ChevronRight,
  Filter, MoreVertical, CheckCircle, XCircle, AlertCircle,
  CalendarCheck, X, Calendar, Trash2, PhoneCall,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { updateSession } from '@/services/api'
import { VideoCall } from '@/components/dashboard/VideoCall'

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = 'confirmed' | 'pending' | 'reschedule_requested' | 'completed'

type Session = {
  id:         string
  client:     string
  initials:   string
  color:      string
  sport:      string
  sportColor: string
  mode:       'Online' | 'In-person'
  location:   string
  dateKey:    string
  date:       string
  time:       string
  duration:   string
  status:     SessionStatus
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TZ = 'Asia/Colombo'

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMondayOfWeek(ref: Date): Date {
  const d   = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekRange(weekOffset: number): { weekStart: Date; weekEnd: Date } {
  const monday = getMondayOfWeek(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekStart = new Date(monday); weekStart.setHours(0, 0, 0, 0)
  const weekEnd   = new Date(monday); weekEnd.setDate(monday.getDate() + 6); weekEnd.setHours(23, 59, 59, 999)
  return { weekStart, weekEnd }
}

function getWeekDays(weekStart: Date) {
  const todayKey = toDateKey(new Date())
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return {
      dateKey: toDateKey(date),
      short:   date.toLocaleDateString('en-US', { weekday: 'short' }),
      date:    String(date.getDate()),
      isToday: toDateKey(date) === todayKey,
    }
  })
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; classes: string; icon: typeof CheckCircle }> = {
  confirmed:            { label: 'Confirmed',           classes: 'bg-green-50 text-green-600',   icon: CheckCircle },
  pending:              { label: 'Pending',              classes: 'bg-amber-50 text-amber-600',   icon: AlertCircle },
  reschedule_requested: { label: 'Reschedule Requested', classes: 'bg-purple-50 text-purple-600', icon: Calendar    },
  completed:            { label: 'Completed',            classes: 'bg-blue-50 text-blue-600',     icon: CheckCircle },
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600',
  'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600',
  'bg-pink-100 text-pink-600', 'bg-indigo-100 text-indigo-600',
]
const SPORT_COLORS = [
  'bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600',
  'bg-green-50 text-green-600', 'bg-amber-50 text-amber-600',
  'bg-pink-50 text-pink-600', 'bg-teal-50 text-teal-600',
]

// ─── WEEK STRIP ───────────────────────────────────────────────────────────────

function WeekStrip({ activeDateKey, setActiveDateKey, weekOffset, setWeekOffset, sessions, loading }: {
  activeDateKey:    string
  setActiveDateKey: (key: string) => void
  weekOffset:       number
  setWeekOffset:    (n: number) => void
  sessions:         Session[]
  loading:          boolean
}) {
  const { weekStart } = useMemo(() => getWeekRange(weekOffset), [weekOffset])
  const week          = useMemo(() => getWeekDays(weekStart), [weekStart])
  const monthLabel    = weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-gray-500">{monthLabel}</span>
        <div className="flex gap-1">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => { setWeekOffset(0); setActiveDateKey(toDateKey(new Date())) }}
            className="px-2 h-7 rounded-full text-xs font-medium text-blue-600 hover:bg-blue-50">
            Today
          </button>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex gap-1">
        {week.map((day) => {
          const isActive    = activeDateKey === day.dateKey
          const hasSessions = !loading && sessions.some((s) => s.dateKey === day.dateKey)
          return (
            <button key={day.dateKey} onClick={() => setActiveDateKey(day.dateKey)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-colors ${
                isActive ? 'bg-blue-600' : day.isToday ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}>
              <span className={`text-xs font-medium mb-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>{day.short}</span>
              <span className={`text-sm font-bold ${isActive ? 'text-white' : day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day.date}</span>
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${hasSessions ? (isActive ? 'bg-blue-200' : 'bg-blue-400') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── CANCEL MODAL ─────────────────────────────────────────────────────────────

function CancelModal({ session, onClose, onConfirm }: { session: Session; onClose: () => void; onConfirm: () => void }) {
  const [saving, setSaving] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-gray-900">Cancel Session</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${session.color}`}>
              {session.initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{session.client}</p>
              <p className="text-xs text-gray-500">{session.sport} · {session.date} at {session.time}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Are you sure you want to cancel this session? The athlete will be notified immediately.</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">
            Keep Session
          </button>
          <button onClick={async () => { setSaving(true); await onConfirm(); setSaving(false) }} disabled={saving}
            className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl ${saving ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>
            {saving ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SESSION MENU ─────────────────────────────────────────────────────────────

function SessionMenu({ session, onReschedule }: { session: Session; onReschedule: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  if (session.status !== 'confirmed') return null
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-48">
          <button onClick={() => { setOpen(false); onReschedule() }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">
            <Calendar className="w-4 h-4 text-gray-400" /> Reschedule
          </button>
        </div>
      )}
    </div>
  )
}

// ─── SESSION CARD ─────────────────────────────────────────────────────────────

function SessionCard({ session, onConfirm, onReschedule, onCancel, onJoin }: {
  session:      Session
  onConfirm:    (id: string) => void
  onReschedule: (id: string) => void
  onCancel:     (id: string) => void
  onJoin:       (id: string, duration: string) => void
}) {
  const { label, classes, icon: StatusIcon } = STATUS_CONFIG[session.status]
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${session.color}`}>
            {session.initials}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{session.client}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${session.sportColor}`}>{session.sport}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${classes}`}>
            <StatusIcon className="w-3 h-3" />{label}
          </span>
          <SessionMenu session={session} onReschedule={() => onReschedule(session.id)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>{session.time} · {session.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {session.mode === 'Online'
            ? <Video  className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            : <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
          <span className="truncate">{session.location}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${session.mode === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
          {session.mode}
        </span>
        <div className="flex gap-2">
          {session.status === 'pending' && (
            <>
              <button onClick={() => onCancel(session.id)}
                className="px-3 py-1.5 border border-red-200 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-50 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Cancel
              </button>
              <button onClick={() => onConfirm(session.id)}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Confirm
              </button>
            </>
          )}
          {session.status === 'confirmed' && session.mode === 'Online' && (
            <button onClick={() => onJoin(session.id, session.duration)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <PhoneCall className="w-3 h-3" /> Join Call
            </button>
          )}
          {session.status === 'reschedule_requested' && (
            <span className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded-lg flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Awaiting Response
            </span>
          )}
          {session.status === 'completed' && (
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ConsultantBookedSessionsPage() {
  const [sessions,      setSessions]      = useState<Session[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [activeDateKey, setActiveDateKey] = useState(toDateKey(new Date()))
  const [weekOffset,    setWeekOffset]    = useState(0)
  const [filterStatus,  setFilterStatus]  = useState<'all' | SessionStatus>('all')
  const [cancelFor,     setCancelFor]     = useState<Session | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [consultantId,  setConsultantId]  = useState<string>('')
  const [activeCall,    setActiveCall]    = useState<{ sessionId: string; durationMinutes: number } | null>(null)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Fetch sessions for current week using coach route with consultantId ───
  const fetchSessions = useCallback(async (id: string, offset: number) => {
    setLoading(true)
    try {
      const { weekStart, weekEnd } = getWeekRange(offset)
      const params = new URLSearchParams({
        coachId:   id,            // consultant is provider_id just like coach
        weekStart: weekStart.toISOString(),
        weekEnd:   weekEnd.toISOString(),
      })
      const res  = await fetch(`/api/sessions?${params}`)
      const data = await res.json()

      if (Array.isArray(data)) {
        setSessions(data)
      } else {
        // API returned raw sessions without shaping — shape them here
        const raw = Array.isArray(data) ? data : []
        setSessions(raw.map((s: any) => {
          const athlete  = Array.isArray(s.athletes) ? s.athletes[0] : s.athletes
          const profile  = Array.isArray(athlete?.profiles) ? athlete.profiles[0] : athlete?.profiles
          const sport    = Array.isArray(s.sports) ? s.sports[0] : s.sports
          const firstName = profile?.first_name ?? ''
          const lastName  = profile?.last_name  ?? ''
          const fullName  = `${firstName} ${lastName}`.trim() || 'Unknown Athlete'
          const inits     = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?'
          const colorIdx  = (athlete?.user_id ?? s.athlete_id ?? '').charCodeAt(0) % AVATAR_COLORS.length
          const sportIdx  = (sport?.name ?? '').charCodeAt(0) % SPORT_COLORS.length
          const date      = new Date(s.scheduled_at)
          const isOnline  = s.location_type === 'online' || s.session_type === 'online'
          const dateKey   = date.toLocaleDateString('en-CA', { timeZone: TZ })
          return {
            id:         String(s.id),
            client:     fullName,
            initials:   inits,
            color:      AVATAR_COLORS[colorIdx],
            sport:      sport?.name ?? 'General',
            sportColor: SPORT_COLORS[sportIdx],
            mode:       isOnline ? 'Online' : 'In-person',
            location:   s.location_details ?? (isOnline ? 'Online Session' : 'In-person'),
            dateKey,
            date:       date.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' }),
            time:       date.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }),
            duration:   `${s.duration_minutes ?? 60} min`,
            status:     s.status ?? 'pending',
          }
        }))
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setError('Not logged in.'); setLoading(false); return }
      setConsultantId(data.user.id)
      fetchSessions(data.user.id, 0)
    })
  }, [fetchSessions])

  // ── Re-fetch on week change ────────────────────────────────────────────────
  useEffect(() => {
    if (!consultantId) return
    fetchSessions(consultantId, weekOffset)
  }, [weekOffset, consultantId, fetchSessions])

  // ── Actions — reuse same updateSession from services/api ──────────────────

  async function handleConfirm(sessionId: string) {
    setActionLoading(sessionId)
    try {
      const res = await updateSession(sessionId, 'approve')
      if (!res) { showToast('Failed to confirm session.', 'error'); return }
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'confirmed' } : s))
      showToast('Session confirmed! Athlete has been notified.', 'success')
    } catch { showToast('Failed to confirm session.', 'error') }
    finally { setActionLoading(null) }
  }

  async function handleReschedule(sessionId: string) {
    try {
      const res = await updateSession(sessionId, 'reschedule')
      if (!res) { showToast('Failed to send reschedule notification.', 'error'); return }
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'reschedule_requested' } : s))
      showToast('Athlete has been notified to reschedule.', 'success')
    } catch { showToast('Failed to send reschedule notification.', 'error') }
  }

  async function handleCancelConfirm() {
    if (!cancelFor) return
    setActionLoading(cancelFor.id)
    try {
      const res = await updateSession(cancelFor.id, 'cancel')
      if (!res) { showToast('Failed to cancel session.', 'error'); return }
      setSessions(prev => prev.filter(s => s.id !== cancelFor.id))
      showToast('Session cancelled. Athlete has been notified.', 'success')
      setCancelFor(null)
    } catch { showToast('Failed to cancel session.', 'error') }
    finally { setActionLoading(null) }
  }

  async function handleJoin(sessionId: string, durationStr: string) {
    setActiveCall({ sessionId, durationMinutes: parseInt(durationStr) || 60 })
  }

  async function handleCallEnd(durationSeconds: number) {
    if (!activeCall) return
    const requiredSeconds = activeCall.durationMinutes * 60 * 0.8
    try {
      const res  = await fetch(`/api/sessions/${activeCall.sessionId}/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ coachId: consultantId, durationSeconds, requiredSeconds }),
      })
      const data = await res.json()
      if (data.completed) {
        setSessions(prev => prev.map(s =>
          s.id === activeCall.sessionId ? { ...s, status: 'completed' } : s
        ))
        showToast(`Session completed! ${data.attendedPct}% attendance. 🎉`, 'success')
      } else {
        const pct = Math.round((durationSeconds / (activeCall.durationMinutes * 60)) * 100)
        showToast(`Call ended. ${pct}% attended — need 80% to auto-complete.`, 'error')
      }
    } catch { showToast('Call ended.', 'success') }
    setActiveCall(null)
  }

  const daySessions     = sessions.filter((s) => s.dateKey === activeDateKey)
  const filtered        = filterStatus === 'all' ? daySessions : daySessions.filter((s) => s.status === filterStatus)
  const totalAll        = sessions.length
  const totalConfirmed  = sessions.filter((s) => s.status === 'confirmed').length
  const totalPending    = sessions.filter((s) => s.status === 'pending').length
  const totalReschedule = sessions.filter((s) => s.status === 'reschedule_requested').length
  const totalCompleted  = sessions.filter((s) => s.status === 'completed').length

  const activeDayDisplay = useMemo(() => {
    const [y, m, d] = activeDateKey.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }, [activeDateKey])

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

      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {cancelFor && (
        <CancelModal
          session={cancelFor}
          onClose={() => setCancelFor(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Booked Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all your consulting sessions.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Total',      value: totalAll,         color: 'text-gray-900'   },
            { label: 'Confirmed',  value: totalConfirmed,   color: 'text-green-600'  },
            { label: 'Pending',    value: totalPending,     color: 'text-amber-600'  },
            { label: 'Reschedule', value: totalReschedule,  color: 'text-purple-600' },
            { label: 'Completed',  value: totalCompleted,   color: 'text-blue-600'   },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            </div>
          ))}
        </div>

        <WeekStrip
          activeDateKey={activeDateKey}
          setActiveDateKey={setActiveDateKey}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          sessions={sessions}
          loading={loading}
        />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">
            {activeDayDisplay} — <span className="text-gray-400 font-normal">{daySessions.length} session{daySessions.length !== 1 ? 's' : ''}</span>
          </p>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {(['all', 'confirmed', 'pending', 'reschedule_requested', 'completed'] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>
                {s === 'all' ? 'All' : s === 'reschedule_requested' ? 'Reschedule' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading sessions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onConfirm={handleConfirm}
                onReschedule={(id) => handleReschedule(id)}
                onCancel={(id) => setCancelFor(sessions.find(s => s.id === id) ?? null)}
                onJoin={handleJoin}
              />
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
