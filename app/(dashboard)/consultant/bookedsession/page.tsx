'use client'

import { useState, useEffect } from 'react'
import {
    Video, MapPin, Clock, ChevronLeft, ChevronRight,
    Filter, Plus, MoreVertical, CheckCircle, XCircle, AlertCircle, CalendarCheck
} from 'lucide-react'

type SessionStatus = 'confirmed' | 'pending' | 'cancelled'

type Session = {
    id: number
    scheduled_at: string
    duration_minutes: number
    status: SessionStatus
    price: number
    location_type: 'online' | 'in_person'
    location_details: string
    athletes: {
        user_id: string
        sports: { name: string }
        profiles: { first_name: string; last_name: string }
    }
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; classes: string; icon: typeof CheckCircle }> = {
    confirmed: { label: 'Confirmed', classes: 'bg-green-50 text-green-600', icon: CheckCircle },
    pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-600', icon: AlertCircle },
    cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-500', icon: XCircle },
}

// Generate initials from name
function getInitials(firstName: string, lastName: string) {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`
}

// Generate avatar color based on name
const AVATAR_COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
    'bg-green-100 text-green-700',
]
function getAvatarColor(name: string) {
    const index = name.charCodeAt(0) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
}

// Get current week days
function getWeekDays(weekOffset: number = 0) {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7)

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        return {
            short: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate(),
            fullDate: date,
            label: date.toDateString(),
        }
    })
}

function WeekStrip({
    activeDay,
    setActiveDay,
    sessions,
    weekOffset,
    setWeekOffset,
}: {
    activeDay: string
    setActiveDay: (d: string) => void
    sessions: Session[]
    weekOffset: number
    setWeekOffset: (n: number) => void
}) {
    const days = getWeekDays(weekOffset)

    return (
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5">
            <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-1 gap-1">
                {days.map((day) => {
                    const isActive = activeDay === day.label
                    const hasSessions = sessions.some(
                        (s) => new Date(s.scheduled_at).toDateString() === day.label
                    )
                    return (
                        <button
                            key={day.label}
                            onClick={() => setActiveDay(day.label)}
                            className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-500'}`}
                        >
                            <span className={`text-xs font-medium mb-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                                {day.short}
                            </span>
                            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                                {day.date}
                            </span>
                            {hasSessions && (
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-200' : 'bg-blue-400'}`} />
                            )}
                        </button>
                    )
                })}
            </div>

            <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )
}

function SessionCard({ session }: { session: Session }) {
    const { label, classes, icon: StatusIcon } = STATUS_CONFIG[session.status] ?? STATUS_CONFIG['pending']
    const firstName = session.athletes?.profiles?.first_name || ''
    const lastName = session.athletes?.profiles?.last_name || ''
    const fullName = `${firstName} ${lastName}`
    const initials = getInitials(firstName, lastName)
    const avatarColor = getAvatarColor(fullName)
    const sportName = session.athletes?.sports?.name || 'Sport'
    const isOnline = session.location_type === 'online'

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow ${session.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor}`}>
                        {initials}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{fullName}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                            {sportName}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${classes}`}>
                        <StatusIcon className="w-3 h-3" />
                        {label}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>
                        {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{session.duration_minutes} min
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {isOnline ? (
                        <Video className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{session.location_details || (isOnline ? 'Online' : 'In-person')}</span>
                </div>
            </div>

            {/* Mode badge + Actions */}
            <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOnline ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {isOnline ? 'Online' : 'In-person'}
                </span>
                <div className="flex gap-2">
                    {session.status !== 'cancelled' && (
                        <>
                            {isOnline && session.status === 'confirmed' && (
                                <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                    Join
                                </button>
                            )}
                            <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                Reschedule
                            </button>
                        </>
                    )}
                    {session.status === 'cancelled' && (
                        <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                            Rebook
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function BookedSessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [activeDay, setActiveDay] = useState(new Date().toDateString())
    const [filterStatus, setFilterStatus] = useState<'all' | SessionStatus>('all')
    const [weekOffset, setWeekOffset] = useState(0)

    // Replace with real auth later
    const consultantId = "YOUR_CONSULTANT_ID"

    useEffect(() => {
        fetch(`/api/consultant/bookedsession?consultant_id=${consultantId}`)
            .then(res => res.json())
            .then(result => {
                if (result.ok) setSessions(result.data.sessions || [])
            })
            .finally(() => setLoading(false))
    }, [])

    const daySessions = sessions.filter(
        (s) => new Date(s.scheduled_at).toDateString() === activeDay
    )

    const filtered = filterStatus === 'all'
        ? daySessions
        : daySessions.filter((s) => s.status === filterStatus)

    const totalAll = sessions.length
    const totalConfirmed = sessions.filter((s) => s.status === 'confirmed').length
    const totalPending = sessions.filter((s) => s.status === 'pending').length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading sessions...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-full">

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booked Sessions</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage and track all your coaching sessions.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    New Session
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                    { label: 'Total Sessions', value: totalAll, color: 'text-gray-900' },
                    { label: 'Confirmed', value: totalConfirmed, color: 'text-green-600' },
                    { label: 'Pending', value: totalPending, color: 'text-amber-600' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500 font-medium">{label}</p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Week Strip */}
            <WeekStrip
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                sessions={sessions}
                weekOffset={weekOffset}
                setWeekOffset={setWeekOffset}
            />

            {/* Filter + count row */}
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
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Session Cards */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {filtered.map((session) => (
                        <SessionCard key={session.id} session={session} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <CalendarCheck className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400 font-medium">No sessions for this day</p>
                    <p className="text-xs text-gray-300 mt-1">Select another day or add a new session</p>
                </div>
            )}
        </div>
    )
}