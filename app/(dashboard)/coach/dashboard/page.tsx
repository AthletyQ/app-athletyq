'use client'

import {
  Users, Bell, User, Video, TrendingUp, DollarSign, Calendar,
  CheckCircle, MapPin,
} from 'lucide-react'

const STATS = [
  { label: 'Total Clients',       value: '24',    sub: '+3 this month',       subColor: 'text-blue-500',  icon: Users    },
  { label: 'Sessions This Week',  value: '18',    sub: '3 today',             subColor: 'text-gray-400',  icon: Calendar },
  { label: 'This Month',          value: '$3,240',sub: '+12% vs last month',  subColor: 'text-green-500', icon: DollarSign },
  { label: 'Client Satisfaction', value: '4.9',   sub: 'Based on 155 reviews',subColor: 'text-gray-400',  icon: TrendingUp },
]

const SESSIONS = [
  { name: 'Sarah Johnson',  type: 'Running',  mode: 'Online',    time: 'Today, 2:00 PM',      duration: '60 min' },
  { name: 'Michael Chen',   type: 'Swimming', mode: 'In-person', time: 'Today, 4:30 PM',      duration: '45 min' },
  { name: 'Emma Rodriguez', type: 'Cycling',  mode: 'Online',    time: 'Tomorrow, 10:00 AM',  duration: '90 min' },
]

const MESSAGES = [
  { name: 'Alex Thompson',  time: '5 min ago',  text: "Thanks for the last session! When can we schedule the next one?", color: 'bg-purple-100 text-purple-700' },
  { name: 'Jennifer Walsh', time: '23 min ago', text: 'I have a question about the training plan you sent...',           color: 'bg-pink-100 text-pink-700'   },
  { name: 'David Kim',      time: '1 hour ago', text: 'Great progress on my sprint times! 🎉',                           color: 'bg-amber-100 text-amber-700' },
]

const ACTIVITIES = [
  { name: 'Sarah Johnson', action: 'Completed workout: 10K Run', time: '2 hours ago' },
]

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('')
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

function Topbar({ name }: { name: string }) {
  return (
    <header className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-b border-gray-100">
      <button className="relative w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
      </button>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{name}</p>
          <p className="text-xs text-gray-400">Coach</p>
        </div>
        <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

// ─── PROFILE CARD ─────────────────────────────────────────────────────────────

function ProfileCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-6">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="w-9 h-9 text-gray-400" />
        </div>
        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Coach Nathan</h2>
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            <TrendingUp className="w-3 h-3" /> ATHLETICS
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" /> Sri Lanka
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Role</p>
            <p className="text-sm font-semibold text-gray-900">Coach</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Email</p>
            <p className="text-sm font-semibold text-gray-900">coach.nathan@athletyq.com</p>
          </div>
        </div>
      </div>

      {/* Coach ID badge */}
      <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right">
        <p className="text-xs text-gray-400 font-medium mb-0.5">COACH ID:</p>
        <p className="text-sm font-bold tracking-widest">NATH2026</p>
      </div>
    </div>
  )
}

// ─── STAT CARDS ───────────────────────────────────────────────────────────────

function StatCards() {
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

// ─── UPCOMING SESSIONS ────────────────────────────────────────────────────────

function UpcomingSessions() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">Upcoming Sessions</h2>
        <button className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">View All</button>
      </div>
      <div className="space-y-3">
        {SESSIONS.map((s) => (
          <div key={s.name} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Video className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-400">{s.type} • {s.mode}</p>
            </div>
            <div className="text-right mr-3">
              <p className="text-sm text-gray-700 font-medium">{s.time}</p>
              <p className="text-xs text-gray-400">{s.duration}</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0">
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EARNINGS SUMMARY ─────────────────────────────────────────────────────────

function EarningsSummary() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">Earnings Summary</h2>
        <button className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">Details</button>
      </div>
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Earnings (This Month)</p>
          <p className="text-2xl font-bold text-gray-900">$3,240</p>
        </div>
        <TrendingUp className="w-8 h-8 text-green-500" />
      </div>
    </div>
  )
}

// ─── NEW MESSAGES ─────────────────────────────────────────────────────────────

function NewMessages() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">New Messages</h2>
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
      </div>
      <div className="space-y-3 mb-4">
        {MESSAGES.map(({ name, time, text, color }) => (
          <div key={name} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
              {initials(name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{time}</p>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors">
        View All Messages
      </button>
    </div>
  )
}

// ─── ATHLETE ACTIVITY ─────────────────────────────────────────────────────────

function AthleteActivity() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 text-base mb-4">Athlete Activity</h2>
      <div className="space-y-3">
        {ACTIVITIES.map(({ name, action, time }) => (
          <div key={name} className="flex gap-3 items-start">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">{action}</p>
              <p className="text-xs text-gray-400 mt-0.5">{time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Topbar name="Coach Nathan" />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">Coach Nathan</span>! Here's what's happening with your coaching today.
          </p>
        </div>
        <ProfileCard />
        <StatCards />
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <UpcomingSessions />
            <EarningsSummary />
          </div>
          <div className="col-span-1">
            <NewMessages />
            <AthleteActivity />
          </div>
        </div>
      </main>
    </div>
  )
}