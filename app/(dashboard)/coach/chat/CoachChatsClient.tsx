'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import {
  Phone, Video, Star, MoreVertical,
  Paperclip, Smile, Send,
  PhoneIncoming, PhoneMissed, PhoneOutgoing,
  Loader2, MessageSquare, ArrowLeft, Search, Trash2, X,
} from 'lucide-react'
import { MessageTicks } from '@/components/chat/MessageTicks'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile { first_name: string; last_name: string }

interface Conversation {
  id: string
  athlete_id: string
  contact_id: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  contact_unread_count: number
  athlete: Profile | null
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
}

type CallRecord = {
  id: number; initials: string; name: string; color: string
  type: 'incoming' | 'outgoing' | 'missed'; duration: string; time: string; date: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1']
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length] }
function initials(p: Profile | null) { if (!p) return '?'; return `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() }
function fullName(p: Profile | null) { if (!p) return 'Unknown'; return `${p.first_name} ${p.last_name}`.trim() }
function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso); const now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const CALL_ICON = {
  incoming: { icon: PhoneIncoming, color: 'text-green-500' },
  outgoing: { icon: PhoneOutgoing, color: 'text-blue-500' },
  missed:   { icon: PhoneMissed,   color: 'text-red-500'   },
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteModal({
  name, onConfirm, onCancel, deleting,
}: {
  name: string; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Delete conversation?</h3>
        <p className="text-sm text-gray-500 mb-6">
          This will permanently delete your chat with{' '}
          <span className="font-semibold text-gray-700">{name}</span> and all messages. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CallItem({ call, onClick, selected }: { call: CallRecord; onClick: () => void; selected: boolean }) {
  const { icon: CallIcon, color } = CALL_ICON[call.type]
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected ? 'bg-blue-50 border-r-2 border-blue-600' : 'hover:bg-gray-50'}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: call.color }}>
        {call.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{call.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <CallIcon className={`w-3 h-3 ${color}`} />
          <span className={`text-xs font-medium capitalize ${color}`}>{call.type}</span>
          {call.duration !== '—' && <span className="text-xs text-gray-400">· {call.duration}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-400">{call.time}</p>
        <p className="text-xs text-gray-300">{call.date}</p>
      </div>
    </div>
  )
}

function CallDetailPanel({ call }: { call: CallRecord }) {
  const { icon: CallIcon, color } = CALL_ICON[call.type]
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="flex items-center px-6 py-4 bg-white border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">Call Details</p>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 gap-6 px-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: call.color }}>
          {call.initials}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 mb-1">{call.name}</p>
          <div className="flex items-center justify-center gap-1.5">
            <CallIcon className={`w-4 h-4 ${color}`} />
            <span className={`text-sm font-medium capitalize ${color}`}>{call.type}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[{ label: 'Date', value: call.date }, { label: 'Time', value: call.time }, { label: 'Duration', value: call.duration }].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
              <p className="text-sm font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
            <Phone className="w-4 h-4" /> Call Back
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">
            <Star className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoachChatsPage() {
  const searchParams         = useSearchParams()
  const targetConversationId = searchParams.get('conversationId')

  const [currentUserId,  setCurrentUserId]  = useState<string | null>(null)
  const [conversations,  setConversations]  = useState<Conversation[]>([])
  const [filtered,       setFiltered]       = useState<Conversation[]>([])
  const [search,         setSearch]         = useState('')
  const [activeConv,     setActiveConv]     = useState<Conversation | null>(null)
  const [messages,       setMessages]       = useState<Message[]>([])
  const [newMessage,     setNewMessage]     = useState('')
  const [sending,        setSending]        = useState(false)
  const [loadingConvs,   setLoadingConvs]   = useState(true)
  const [loadingMsgs,    setLoadingMsgs]    = useState(false)
  const [showList,       setShowList]       = useState(true)
  const [activeTab,      setActiveTab]      = useState<'Chats' | 'Calls'>('Chats')
  const [selectedCall,   setSelectedCall]   = useState<CallRecord | null>(null)
  const [autoOpened,     setAutoOpened]     = useState(false)
  const [convMenuOpen,   setConvMenuOpen]   = useState<string | null>(null)
  const [deleteTarget,   setDeleteTarget]   = useState<Conversation | null>(null)
  const [deleting,       setDeleting]       = useState(false)

  const calls: CallRecord[] = []

  const bottomRef      = useRef<HTMLDivElement>(null)
  const msgChannelRef  = useRef<RealtimeChannel | null>(null)
  const convChannelRef = useRef<RealtimeChannel | null>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const menuRef        = useRef<HTMLDivElement>(null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // ── Close menu on outside click ───────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setConvMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Fetch conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async (userId: string) => {
    setLoadingConvs(true)
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id, athlete_id, contact_id,
        last_message, last_message_at,
        unread_count, contact_unread_count,
        athlete:profiles!conversations_athlete_id_fkey (first_name, last_name)
      `)
      .eq('contact_id', userId)
      .order('last_message_at', { ascending: false })

    if (!error && data) {
      const shaped = data.map((c: any) => ({
        ...c,
        athlete: Array.isArray(c.athlete) ? c.athlete[0] ?? null : c.athlete,
      })) as Conversation[]
      setConversations(shaped)
      setFiltered(shaped)
    }
    setLoadingConvs(false)
  }, [])

  useEffect(() => {
    if (currentUserId) fetchConversations(currentUserId)
  }, [currentUserId, fetchConversations])

  // ── Auto-open from query param ────────────────────────────────────────────
  useEffect(() => {
    if (autoOpened || !targetConversationId || conversations.length === 0) return
    const target = conversations.find((c) => c.id === targetConversationId)
    if (target) { openConversation(target); setAutoOpened(true) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, targetConversationId, autoOpened])

  // ── Realtime: conversations ───────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return
    convChannelRef.current?.unsubscribe()
    convChannelRef.current = supabase
      .channel(`coach-convs-${currentUserId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'conversations',
        filter: `contact_id=eq.${currentUserId}`,
      }, () => fetchConversations(currentUserId))
      .subscribe()
    return () => { convChannelRef.current?.unsubscribe() }
  }, [currentUserId, fetchConversations])

  // ── Search filter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? conversations.filter((c) =>
            fullName(c.athlete).toLowerCase().includes(q) ||
            (c.last_message ?? '').toLowerCase().includes(q))
        : conversations,
    )
  }, [search, conversations])

  // ── Fetch messages ────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, is_read')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    if (!error && data) setMessages(data as Message[])
    setLoadingMsgs(false)
  }, [])

  // ── Mark read ─────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (convId: string, userId: string) => {
    await supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', convId).neq('sender_id', userId).eq('is_read', false)
    await supabase.from('conversations').update({ contact_unread_count: 0 }).eq('id', convId)
  }, [])

  // ── Open conversation ─────────────────────────────────────────────────────
  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv)
    setShowList(false)
    setActiveTab('Chats')
    await fetchMessages(conv.id)
    if (currentUserId) await markAsRead(conv.id, currentUserId)
  }, [fetchMessages, markAsRead, currentUserId])

  // ── Delete conversation ───────────────────────────────────────────────────
  const handleDeleteConversation = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await supabase.from('messages').delete().eq('conversation_id', deleteTarget.id)
      await supabase.from('conversations').delete().eq('id', deleteTarget.id)
      setConversations(prev => prev.filter(c => c.id !== deleteTarget.id))
      setFiltered(prev => prev.filter(c => c.id !== deleteTarget.id))
      if (activeConv?.id === deleteTarget.id) {
        setActiveConv(null)
        setMessages([])
        setShowList(true)
      }
    } catch (err) {
      console.error('Delete conversation failed:', err)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // ── Realtime: messages ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeConv) return
    msgChannelRef.current?.unsubscribe()
    msgChannelRef.current = supabase
      .channel(`coach-msgs-${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        const msg = payload.new as Message
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
        if (currentUserId && msg.sender_id !== currentUserId)
          markAsRead(activeConv.id, currentUserId)
      })
      .subscribe()
    return () => { msgChannelRef.current?.unsubscribe() }
  }, [activeConv, currentUserId, markAsRead])

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const content = newMessage.trim()
    if (!content || !activeConv || !currentUserId || sending) return
    setSending(true)
    setNewMessage('')
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id:       currentUserId,
      content,
      is_read:         false,
    })
    if (!error) {
      await supabase.from('conversations').update({
        last_message:    content,
        last_message_at: new Date().toISOString(),
        unread_count:    (activeConv.unread_count ?? 0) + 1,
      }).eq('id', activeConv.id)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {deleteTarget && (
        <DeleteModal
          name={fullName(deleteTarget.athlete)}
          onConfirm={handleDeleteConversation}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="flex h-[calc(100vh-64px)] bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Left panel ── */}
        <div className={`flex flex-col w-full md:w-80 border-r border-gray-100 flex-shrink-0 bg-white ${showList ? 'flex' : 'hidden md:flex'}`}>

          <div className="px-3 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-4 px-4 border-b border-gray-100 mb-1">
            {(['Chats', 'Calls'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedCall(null) }}
                className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Chats' && (
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
                  <MessageSquare size={32} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No conversations yet</p>
                </div>
              ) : (
                filtered.map((conv) => {
                  const isActive = activeConv?.id === conv.id
                  const unread   = conv.contact_unread_count ?? 0
                  const menuOpen = convMenuOpen === conv.id

                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 border-b border-gray-50 cursor-pointer ${
                        isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                      }`}
                      onClick={() => openConversation(conv)}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                        style={{ backgroundColor: avatarColor(conv.athlete_id) }}
                      >
                        {initials(conv.athlete)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {fullName(conv.athlete)}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                            {conv.last_message ?? 'No messages yet'}
                          </p>
                          {unread > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Three-dot menu */}
                      <div className="relative flex-shrink-0" ref={menuOpen ? menuRef : null}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConvMenuOpen(menuOpen ? null : conv.id) }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-opacity ${
                            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv); setConvMenuOpen(null) }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'Calls' && (
            <div className="flex-1 overflow-y-auto">
              {calls.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <Phone className="w-8 h-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No call history</p>
                </div>
              ) : (
                calls.map((call) => (
                  <CallItem key={call.id} call={call} onClick={() => setSelectedCall(call)} selected={call.id === selectedCall?.id} />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showList ? 'flex' : 'hidden md:flex'}`}>
          {activeTab === 'Calls' ? (
            selectedCall
              ? <CallDetailPanel call={selectedCall} />
              : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Phone className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium text-gray-400">Select a call to view details</p>
                  </div>
                </div>
              )
          ) : activeConv ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowList(true)} className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ArrowLeft size={18} />
                  </button>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(activeConv.athlete_id) }}
                  >
                    {initials(activeConv.athlete)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{fullName(activeConv.athlete)}</p>
                    <p className="text-xs text-green-500 font-medium">Athlete</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[Phone, Video, Star].map((Icon, i) => (
                    <button key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                  <div className="relative" ref={convMenuOpen === activeConv.id + '-header' ? menuRef : null}>
                    <button
                      onClick={() => setConvMenuOpen(convMenuOpen === activeConv.id + '-header' ? null : activeConv.id + '-header')}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {convMenuOpen === activeConv.id + '-header' && (
                      <div className="absolute right-0 top-10 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                        <button
                          onClick={() => { setDeleteTarget(activeConv); setConvMenuOpen(null) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-2 mt-1"
                            style={{ backgroundColor: avatarColor(activeConv.athlete_id) }}
                          >
                            {initials(activeConv.athlete)}
                          </div>
                        )}
                        <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1 flex items-center gap-1">
                            {formatTime(msg.created_at)}
                            {isMine && <MessageTicks status={msg.is_read ? 'read' : 'delivered'} />}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
                <button className="text-gray-400 hover:text-gray-600 p-1"><Paperclip className="w-5 h-5" /></button>
                <button className="text-gray-400 hover:text-gray-600 p-1"><Smile className="w-5 h-5" /></button>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent focus:outline-none"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    newMessage.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-default'
                  }`}
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="font-medium text-gray-400">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
