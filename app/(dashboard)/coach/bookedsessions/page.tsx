'use client'

import { useState } from 'react'
import {
    LayoutDashboard, Users, MessageSquare, CalendarCheck,
    Bell, User, Video, MapPin, Clock, ChevronLeft, ChevronRight,
    Filter, Plus, MoreVertical, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'


type SessionStatus = 'confirmed' | 'pending' | 'cancelled'

type Session = {
    id: number
    client: string
    initials: string
    color: string
    sport: string
    sportColor: string
    mode: 'Online' | 'In-person'
    location: string
    date: string
    time: string
    duration: string
    status: SessionStatus
}


const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Users, label: 'Clients' },
    { icon: MessageSquare, label: 'Chats' },
    { icon: CalendarCheck, label: 'Booked Sessions' },
]

const SESSIONS: Session[] = [
    {
        id: 1,
        client: 'Sarah Johnson',
        initials: 'SJ',
        color: 'bg-blue-100 text-blue-700',
        sport: 'Running',
        sportColor: 'bg-blue-50 text-blue-600',
        mode: 'Online',
        location: 'Zoom Call',
        date: 'Mon, Feb 24',
        time: '10:00 AM',
        duration: '60 min',
        status: 'confirmed',
    },
    {
        id: 2,
        client: 'Michael Chen',
        initials: 'MC',
        color: 'bg-indigo-100 text-indigo-700',
        sport: 'Swimming',
        sportColor: 'bg-cyan-50 text-cyan-600',
        mode: 'In-person',
        location: 'City Aquatic Centre',
        date: 'Mon, Feb 24',
        time: '2:00 PM',
        duration: '45 min',
        status: 'confirmed',
    },
    {
        id: 3,
        client: 'Emma Rodriguez',
        initials: 'ER',
        color: 'bg-purple-100 text-purple-700',
        sport: 'Cycling',
        sportColor: 'bg-orange-50 text-orange-600',
        mode: 'Online',
        location: 'Google Meet',
        date: 'Tue, Feb 25',
        time: '9:00 AM',
        duration: '90 min',
        status: 'pending',
    },
    {
        id: 4,
        client: 'David Kim',
        initials: 'DK',
        color: 'bg-amber-100 text-amber-700',
        sport: 'Strength',
        sportColor: 'bg-red-50 text-red-600',
        mode: 'In-person',
        location: 'FitZone Gym, Studio B',
        date: 'Tue, Feb 25',
        time: '5:00 PM',
        duration: '60 min',
        status: 'confirmed',
    },
    {
        id: 5,
        client: 'Priya Patel',
        initials: 'PP',
        color: 'bg-pink-100 text-pink-700',
        sport: 'Yoga',
        sportColor: 'bg-pink-50 text-pink-600',
        mode: 'Online',
        location: 'Zoom Call',
        date: 'Wed, Feb 26',
        time: '7:30 AM',
        duration: '45 min',
        status: 'cancelled',
    },
    {
        id: 6,
        client: 'James Wilson',
        initials: 'JW',
        color: 'bg-green-100 text-green-700',
        sport: 'Tennis',
        sportColor: 'bg-yellow-50 text-yellow-600',
        mode: 'In-person',
        location: 'Riverside Courts',
        date: 'Thu, Feb 27',
        time: '11:00 AM',
        duration: '60 min',
        status: 'pending',
    },
    {
        id: 7,
        client: 'Sarah Johnson',
        initials: 'SJ',
        color: 'bg-blue-100 text-blue-700',
        sport: 'Running',
        sportColor: 'bg-blue-50 text-blue-600',
        mode: 'Online',
        location: 'Zoom Call',
        date: 'Fri, Feb 28',
        time: '10:00 AM',
        duration: '60 min',
        status: 'confirmed',
    },
]

const WEEK_DAYS = ['Mon, Feb 24', 'Tue, Feb 25', 'Wed, Feb 26', 'Thu, Feb 27', 'Fri, Feb 28', 'Sat, Mar 1', 'Sun, Mar 2']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_DATES = ['24', '25', '26', '27', '28', '1', '2']

const STATUS_CONFIG: Record<SessionStatus, { label: string; classes: string; icon: typeof CheckCircle }> = {
    confirmed: { label: 'Confirmed', classes: 'bg-green-50 text-green-600', icon: CheckCircle },
    pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-600', icon: AlertCircle },
    cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-500', icon: XCircle },
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ activeNav, setActiveNav }: { activeNav: string; setActiveNav: (l: string) => void }) {
    return (
        <aside className="w-44 h-full bg-blue-600 flex flex-col flex-shrink-0">
            <div className="px-5 py-6">
                <h1 className="text-white font-bold text-xl tracking-tight">AthliyQ</h1>
            </div>
            <nav className="flex flex-col gap-1 px-3 mt-1">
                {NAV_ITEMS.map(({ icon: Icon, label }) => (
                    <button
                        key={label}
                        onClick={() => setActiveNav(label)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeNav === label
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


function WeekStrip({ activeDay, setActiveDay }: { activeDay: string; setActiveDay: (d: string) => void }) {
    return (
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5">
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
                <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-1 gap-1">
                {WEEK_DAYS.map((day, i) => {
                    const isActive = activeDay === day
                    const hasSessions = SESSIONS.some((s) => s.date === day)
                    return (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-500'
                                }`}
                        >
                            <span className={`text-xs font-medium mb-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                                {SHORT_DAYS[i]}
                            </span>
                            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                                {DAY_DATES[i]}
                            </span>
                            {hasSessions && (
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-200' : 'bg-blue-400'}`} />
                            )}
                        </button>
                    )
                })}
            </div>

            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )
}


function SessionCard({ session }: { session: Session }) {
    const { label, classes, icon: StatusIcon } = STATUS_CONFIG[session.status]

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow ${session.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'
            }`}>
            {/* Header */}
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
                    <span>{session.time} · {session.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {session.mode === 'Online' ? (
                        <Video className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{session.location}</span>
                </div>
            </div>

            {/* Mode badge */}
            <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${session.mode === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {session.mode}
                </span>

                {/* Actions */}
                <div className="flex gap-2">
                    {session.status !== 'cancelled' && (
                        <>
                            {session.mode === 'Online' && session.status === 'confirmed' && (
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

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function BookedSessionsPage() {
    const [activeNav, setActiveNav] = useState('Booked Sessions')
    const [activeDay, setActiveDay] = useState('Mon, Feb 24')
    const [filterStatus, setFilterStatus] = useState<'all' | SessionStatus>('all')

    const daySessions = SESSIONS.filter((s) => s.date === activeDay)
    const filtered = filterStatus === 'all'
        ? daySessions
        : daySessions.filter((s) => s.status === filterStatus)

    const totalAll = SESSIONS.length
    const totalConfirmed = SESSIONS.filter((s) => s.status === 'confirmed').length
    const totalPending = SESSIONS.filter((s) => s.status === 'pending').length

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

            <div className="flex flex-col flex-1 min-w-0">
                <Topbar />

                <main className="flex-1 overflow-y-auto p-6">
                    {/* Page header */}
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

                    {/* Summary cards */}
                    <div className="grid grid-cols-3 gap-4 mb-5">
                        {[
                            { label: 'Total Sessions', value: totalAll, color: 'text-gray-900', bg: 'bg-white' },
                            { label: 'Confirmed', value: totalConfirmed, color: 'text-green-600', bg: 'bg-white' },
                            { label: 'Pending', value: totalPending, color: 'text-amber-600', bg: 'bg-white' },
                        ].map(({ label, value, color, bg }) => (
                            <div key={label} className={`${bg} rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between`}>
                                <p className="text-sm text-gray-500 font-medium">{label}</p>
                                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Week strip */}
                    <WeekStrip activeDay={activeDay} setActiveDay={setActiveDay} />

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
                                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session cards */}
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
                </main>
            </div>
        </div>
    )
}
