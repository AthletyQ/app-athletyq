'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import {
  Bell, User, X, ChevronRight, UserCircle,
  PencilLine, Settings, LogOut, CheckCheck,
  CalendarCheck, MessageSquare, AlertCircle, DollarSign,
} from 'lucide-react'
import { getCoachProfile } from '@/services/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

type DrawerView = 'menu' | 'view-profile' | 'edit-profile' | 'settings'

type Notification = {
  id:         number
  type:       string
  title:      string
  message:    string
  is_read:    boolean
  created_at: string
  action_url: string | null
  action_text:string | null
}

// ─── NOTIFICATION ICON ───────────────────────────────────────────────────────

function notifIcon(type: string) {
  if (type.includes('session'))  return <CalendarCheck className="w-4 h-4 text-blue-500"   />
  if (type.includes('message'))  return <MessageSquare  className="w-4 h-4 text-green-500"  />
  if (type.includes('payment'))  return <DollarSign     className="w-4 h-4 text-amber-500"  />
  if (type.includes('cancel'))   return <AlertCircle    className="w-4 h-4 text-red-500"    />
  return                                <Bell           className="w-4 h-4 text-gray-500"   />
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1)    return 'Just now'
  if (diff < 60)   return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

// ─── NOTIFICATIONS DRAWER ────────────────────────────────────────────────────

function NotificationsDrawer({
  open, onClose, userId,
}: {
  open:    boolean
  onClose: () => void
  userId:  string
}) {
  const ref                               = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    supabase
      .from('notifications')
      .select('id, type, title, message, is_read, created_at, action_url, action_text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setNotifications(data ?? [])
        setLoading(false)
      })
  }, [open, userId])

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: number) {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} />
      <div
        ref={ref}
        className={`fixed top-0 right-0 z-50 h-full w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            {unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <Bell className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">No notifications yet</p>
              <p className="text-xs text-gray-300 mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !n.is_read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    !n.is_read ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {notifIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    {n.action_text && n.action_url && (
                      
                       
                      <a href={n.action_url}
                        className="inline-block mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {n.action_text} →
                      </a>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── PROFILE DRAWER ───────────────────────────────────────────────────────────

function ProfileDrawer({
  open, onClose, profile,
}: {
  open:    boolean
  onClose: () => void
  profile: any
}) {
  const router              = useRouter()
  const ref                 = useRef<HTMLDivElement>(null)
  const [view, setView]     = useState<DrawerView>('menu')
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    firstName:         '',
    lastName:          '',
    specialization:    '',
    yearsOfExperience: '',
    phoneNumber:       '',
  })

  useEffect(() => {
    if (!open) setTimeout(() => setView('menu'), 300)
  }, [open])

  useEffect(() => {
    if (profile) {
      setForm({
        firstName:         profile.firstName         ?? '',
        lastName:          profile.lastName          ?? '',
        specialization:    profile.specialization    ?? '',
        yearsOfExperience: String(profile.yearsOfExperience ?? ''),
        phoneNumber:       profile.phoneNumber       ?? '',
      })
    }
  }, [profile])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSaveProfile() {
    setSaving(true)
    setTimeout(() => { setSaving(false); setView('menu') }, 1000)
  }

  const BackBtn = ({ to }: { to: DrawerView }) => (
    <button
      onClick={() => setView(to)}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
    >
      <ChevronRight className="w-4 h-4 rotate-180" />
    </button>
  )

  const CloseBtn = () => (
    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
      <X className="w-4 h-4" />
    </button>
  )

  const AvatarBlock = ({ size = 'sm' }: { size?: 'sm' | 'lg' }) => {
    const s = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-lg'
    return profile?.profileImageUrl ? (
      <img src={profile.profileImageUrl} alt={profile.fullName} className={`${s} rounded-full object-cover flex-shrink-0`} />
    ) : (
      <div className={`${s} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}>
        <span className="font-bold text-blue-600">{profile?.initials ?? '??'}</span>
      </div>
    )
  }

  // ─── VIEW PROFILE ───────────────────────────────────────────────────────────
  if (view === 'view-profile') return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div ref={ref} className={`fixed top-0 right-0 z-50 h-full w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <BackBtn to="menu" /><p className="text-sm font-bold text-gray-900 flex-1">View Profile</p><CloseBtn />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div className="flex flex-col items-center py-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <AvatarBlock size="lg" />
            <p className="text-lg font-bold text-gray-900 mt-3">{profile?.fullName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{profile?.email}</p>
            <span className="mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-600">
              {profile?.sport?.toUpperCase() ?? 'COACH'}
            </span>
          </div>
          {[
            { label: 'Role',           value: 'Coach'                                       },
            { label: 'Sport',          value: profile?.sport           ?? '—'               },
            { label: 'Specialization', value: profile?.specialization  ?? '—'               },
            { label: 'Experience',     value: `${profile?.yearsOfExperience ?? '—'} years`  },
            { label: 'Rating',         value: `⭐ ${profile?.rating    ?? '—'}`             },
            { label: 'Total Sessions', value: String(profile?.totalSessions ?? 0)           },
            { label: 'Phone',          value: profile?.phoneNumber     ?? '—'               },
            { label: 'Email',          value: profile?.email           ?? '—'               },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-gray-900 text-right max-w-[60%] break-words">{value}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-6 pt-3">
          <button onClick={() => setView('edit-profile')} className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
            Edit Profile
          </button>
        </div>
      </div>
    </>
  )

  // ─── EDIT PROFILE ───────────────────────────────────────────────────────────
  if (view === 'edit-profile') return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div ref={ref} className={`fixed top-0 right-0 z-50 h-full w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <BackBtn to="menu" /><p className="text-sm font-bold text-gray-900 flex-1">Edit Profile</p><CloseBtn />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {[
            { key: 'firstName',         label: 'First Name',          type: 'text'   },
            { key: 'lastName',          label: 'Last Name',           type: 'text'   },
            { key: 'specialization',    label: 'Specialization',      type: 'text'   },
            { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
            { key: 'phoneNumber',       label: 'Phone Number',        type: 'tel'    },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          ))}
        </div>
        <div className="px-5 pb-6 pt-3 flex gap-3">
          <button onClick={() => setView('menu')} className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSaveProfile} disabled={saving} className={`flex-1 py-3 text-white text-sm font-semibold rounded-xl transition-colors ${saving ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )

  // ─── SETTINGS ───────────────────────────────────────────────────────────────
  if (view === 'settings') return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div ref={ref} className={`fixed top-0 right-0 z-50 h-full w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <BackBtn to="menu" /><p className="text-sm font-bold text-gray-900 flex-1">Settings</p><CloseBtn />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Notifications</p>
            {[
              { label: 'Session reminders',   sub: 'Get notified before sessions'    },
              { label: 'New client requests', sub: 'Alert when athletes request you' },
              { label: 'Message alerts',      sub: 'Notify on new messages'          },
            ].map(({ label, sub }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                <div><p className="text-sm font-semibold text-gray-900">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
                <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer flex-shrink-0">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 mt-4">Privacy</p>
            {[
              { label: 'Profile visibility', sub: 'Allow athletes to find you'  },
              { label: 'Show online status', sub: "Display when you're active"  },
            ].map(({ label, sub }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                <div><p className="text-sm font-semibold text-gray-900">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
                <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer flex-shrink-0">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 mt-4">Account</p>
            {['Change Password', 'Privacy Policy', 'Terms of Service'].map((label) => (
              <button key={label} className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2 border border-gray-100 hover:bg-gray-100 transition-colors">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  // ─── MAIN MENU ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div ref={ref} className={`fixed top-0 right-0 z-50 h-full w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">My Account</p>
          <CloseBtn />
        </div>
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt={profile.fullName} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-blue-600">{profile?.initials ?? '??'}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">{profile?.fullName ?? 'Coach'}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email ?? ''}</p>
              <span className="inline-flex items-center mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {profile?.sport?.toUpperCase() ?? 'COACH'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Rating',     value: profile?.rating              ?? '—' },
              { label: 'Sessions',   value: profile?.totalSessions       ?? '0' },
              { label: 'Experience', value: `${profile?.yearsOfExperience ?? '—'}y` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                <p className="text-sm font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 px-4 py-4 space-y-2">
          {[
            { icon: UserCircle, label: 'View Profile', sub: 'See your public profile', color: 'text-blue-600',   bg: 'bg-blue-50',   view: 'view-profile' as DrawerView },
            { icon: PencilLine, label: 'Edit Profile', sub: 'Update your information', color: 'text-indigo-600', bg: 'bg-indigo-50', view: 'edit-profile' as DrawerView },
            { icon: Settings,   label: 'Settings',     sub: 'Preferences & account',   color: 'text-gray-600',   bg: 'bg-gray-100',  view: 'settings'     as DrawerView },
          ].map(({ icon: Icon, label, sub, color, bg, view: v }) => (
            <button key={label} onClick={() => setView(v)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
            </button>
          ))}
        </div>
        <div className="px-4 pb-6">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-left group">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-500">Logout</p>
              <p className="text-xs text-red-300">Sign out of your account</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-200 group-hover:text-red-300" />
          </button>
        </div>
      </div>
    </>
  )
}

// ─── MAIN TOPBAR COMPONENT ───────────────────────────────────────────────────

export function CoachTopbar() {
  const [profile,          setProfile]          = useState<any>(null)
  const [userId,           setUserId]           = useState<string>('')
  const [unreadCount,      setUnreadCount]      = useState(0)
  const [profileDrawerOpen,setProfileDrawerOpen]= useState(false)
  const [notifDrawerOpen,  setNotifDrawerOpen]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const profileData = await getCoachProfile(user.id)
      if (profileData) setProfile(profileData)

      // get unread count
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count ?? 0)
    }
    load()
  }, [])

  return (
    <>
      <NotificationsDrawer
        open={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        userId={userId}
      />
      <ProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        profile={profile}
      />

      {/* ✅ Topbar — notification left, name+avatar right */}
      <header className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">

        {/* Name + role — left of avatar */}
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {profile?.fullName ?? 'Coach'}
          </p>
          <p className="text-xs text-gray-400">Coach</p>
        </div>

        {/* Profile icon */}
        <button
          onClick={() => setProfileDrawerOpen(true)}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-300 transition-colors"
        >
          <User className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Notification bell — rightmost */}
        <button
          onClick={() => setNotifDrawerOpen(true)}
          className="relative w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-300 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

      </header>
    </>
  )
}