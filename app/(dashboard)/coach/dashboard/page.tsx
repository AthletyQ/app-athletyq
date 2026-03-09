'use client'

import { useState, useEffect } from 'react'
import {
  Users, Bell, User, Video, TrendingUp, DollarSign, Calendar,
  CheckCircle, MapPin,
} from 'lucide-react'
import {
  getCoachProfile, getDashboardStats,
  getDashboardSessions, getDashboardMessages,
} from '@/services/api'

const COACH_USER_ID = '3c8b590f-b28d-4f3a-9451-002dc279fcb1' // replace with auth session later

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('')
}

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

function ProfileCard({ profile }: { profile: any }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-6">
      <div className="relative flex-shrink-0">
        {profile.profileImageUrl ? (
          <img src={profile.profileImageUrl} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-400">{profile.initials}</span>
          </div>
        )}
        {profile.isAvailable && (
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.fullName}</h2>
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            <TrendingUp className="w-3 h-3" /> {profile.sport?.toUpperCase()}
          </span>
          {profile.specialization && (
            <span className="text-xs text-gray-500">{profile.specialization}</span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Role</p>
            <p className="text-sm font-semibold text-gray-900">Coach</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Email</p>
            <p className="text-sm font-semibold text-gray-900">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Experience</p>
            <p className="text-sm font-semibold text-gray-900">{profile.yearsOfExperience} yrs</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Rating</p>
            <p className="text-sm font-semibold text-gray-900">⭐ {profile.rating}</p>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right">
        <p className="text-xs text-gray-400 font-medium mb-0.5">COACH ID:</p>
        <p className="text-sm font-bold tracking-widest">{profile.id?.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs text-gray-400 mt-2">{profile.totalSessions} sessions</p>
      </div>
    </div>
  )
}

function StatCards({ stats }: { stats: any }) {
  const STATS = [
    { label: 'Total Clients',       value: String(stats?.totalClients ?? '—'),     sub: '+3 this month',       subColor: 'text-blue-500',  icon: Users      },
    { label: 'Sessions This Week',  value: String(stats?.sessionsThisWeek ?? '—'), sub: '3 today',             subColor: 'text-gray-400',  icon: Calendar   },
    { label: 'This Month',          value: stats?.monthlyEarnings ?? '—',          sub: '+12% vs last month',  subColor: 'text-green-500', icon: DollarSign },
    { label: 'Client Satisfaction', value: stats?.clientSatisfaction ?? '—',       sub: 'Based on reviews',    subColor: 'text-gray-400',  icon: TrendingUp },
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

function UpcomingSessions({ sessions }: { sessions: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">Upcoming Sessions</h2>
        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
      </div>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
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
            <button className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex-shrink-0">
              Join
            </button>
          </div>
        ))}
      </div>
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

function NewMessages({ messages }: { messages: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">New Messages</h2>
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
          {messages.length}
        </span>
      </div>
      <div className="space-y-3 mb-4">
        {messages.map(({ id, name, time, text, color }) => (
          <div key={id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
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
      <button className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50">
        View All Messages
      </button>
    </div>
  )
}

function AthleteActivity() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 text-base mb-4">Athlete Activity</h2>
      <div className="flex flex-col items-center justify-center h-20 text-gray-300 text-xs">
        No recent activity
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [profile,  setProfile]  = useState<any>(null)
  const [stats,    setStats]    = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const profileData = await getCoachProfile(COACH_USER_ID)
        const [statsData, sessionsData, messagesData] = await Promise.all([
          getDashboardStats(profileData.id),
          getDashboardSessions(profileData.id),
          getDashboardMessages(profileData.id),
        ])
        setProfile(profileData)
        setStats(statsData)
        setSessions(sessionsData)
        setMessages(messagesData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Topbar name={profile?.fullName ?? 'Coach'} />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome <span className="font-semibold text-gray-700">{profile?.fullName}</span>! Here's what's happening with your coaching today.
          </p>
        </div>
        <ProfileCard profile={profile} />
        <StatCards stats={stats} />
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <UpcomingSessions sessions={sessions} />
            <EarningsSummary earnings={stats?.monthlyEarnings ?? '—'} />
          </div>
          <div className="col-span-1">
            <NewMessages messages={messages} />
            <AthleteActivity />
          </div>
        </div>
      </main>
    </div>
  )
}