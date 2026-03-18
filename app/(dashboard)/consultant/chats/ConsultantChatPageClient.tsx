'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Send, Search, MessageSquare, Loader2, ArrowLeft } from 'lucide-react'
import { MessageTicks } from '@/components/chat/MessageTicks'
import { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  first_name: string
  last_name: string
}

interface Conversation {
  id: string
  athlete_id: string
  contact_id: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number         // athlete unread (for athlete view)
  contact_unread_count: number // consultant unread
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6366F1','#8B5CF6','#0EA5E9','#10B981','#F59E0B','#EC4899']

function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(p: Profile | null) {
  if (!p) return '?'
  return `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase()
}

function fullName(p: Profile | null) {
  if (!p) return 'Unknown'
  return `${p.first_name} ${p.last_name}`.trim()
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConsultantChatPageClient() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filtered, setFiltered] = useState<Conversation[]>([])
  const [search, setSearch] = useState('')
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [showList, setShowList] = useState(true) // mobile: toggle list/chat

  const bottomRef = useRef<HTMLDivElement>(null)
  const msgChannelRef = useRef<RealtimeChannel | null>(null)
  const convChannelRef = useRef<RealtimeChannel | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // ── Fetch conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async (userId: string) => {
    setLoadingConvs(true)
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        athlete_id,
        contact_id,
        last_message,
        last_message_at,
        unread_count,
        contact_unread_count,
        athlete:profiles!conversations_athlete_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('contact_id', userId)
      .order('last_message_at', { ascending: false })

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // ── Realtime: conversations list ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return

    convChannelRef.current?.unsubscribe()

    convChannelRef.current = supabase
      .channel(`consultant-convs-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `contact_id=eq.${currentUserId}`,
        },
        () => fetchConversations(currentUserId),
      )
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
            (c.last_message ?? '').toLowerCase().includes(q),
          )
        : conversations,
    )
  }, [search, conversations])

  // ── Fetch messages for active conversation ────────────────────────────────
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

  // ── Mark messages as read ─────────────────────────────────────────────────
  const markAsRead = useCallback(async (convId: string, userId: string) => {
    // Mark individual messages read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', userId)
      .eq('is_read', false)

    // Reset consultant unread counter
    await supabase
      .from('conversations')
      .update({ contact_unread_count: 0 })
      .eq('id', convId)
  }, [])

  // ── Open conversation ─────────────────────────────────────────────────────
  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv)
    setShowList(false)
    await fetchMessages(conv.id)
    if (currentUserId) await markAsRead(conv.id, currentUserId)
  }, [fetchMessages, markAsRead, currentUserId])

  // ── Realtime: messages in active conversation ─────────────────────────────
  useEffect(() => {
    if (!activeConv) return

    msgChannelRef.current?.unsubscribe()

    msgChannelRef.current = supabase
      .channel(`consultant-msgs-${activeConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          // Auto-mark read if the new message is from the athlete
          if (currentUserId && msg.sender_id !== currentUserId) {
            markAsRead(activeConv.id, currentUserId)
          }
        },
      )
      .subscribe()

    return () => { msgChannelRef.current?.unsubscribe() }
  }, [activeConv, currentUserId, markAsRead])

  // ── Scroll to bottom on new messages ─────────────────────────────────────
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
      // Update conversation's last_message + increment athlete's unread count
      await supabase
        .from('conversations')
        .update({
          last_message:    content,
          last_message_at: new Date().toISOString(),
          unread_count:    (activeConv.unread_count ?? 0) + 1,
        })
        .eq('id', activeConv.id)
    }

    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ── Conversation List ── */}
      <div className={`
        flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 flex-shrink-0
        ${showList ? 'flex' : 'hidden md:flex'}
      `}>
        {/* List header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
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

              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    hover:bg-gray-50 border-b border-gray-50
                    ${isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}
                  `}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(conv.athlete_id) }}
                  >
                    {initials(conv.athlete)}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {fullName(conv.athlete)}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {conv.last_message ?? 'No messages yet'}
                      </p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Message Window ── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${!showList ? 'flex' : 'hidden md:flex'}
      `}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
              {/* Back button (mobile) */}
              <button
                onClick={() => setShowList(true)}
                className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <ArrowLeft size={18} />
              </button>

              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: avatarColor(activeConv.athlete_id) }}
              >
                {initials(activeConv.athlete)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{fullName(activeConv.athlete)}</p>
                <p className="text-xs text-green-500 font-medium">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <MessageSquare size={32} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Other person avatar */}
                      {!isMine && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-2 mt-1"
                          style={{ backgroundColor: avatarColor(activeConv.athlete_id) }}
                        >
                          {initials(activeConv.athlete)}
                        </div>
                      )}

                      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        <div
                          className={`
                            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                            ${isMine
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                            }
                          `}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">
                          {formatTime(msg.created_at)}
                          {isMine && <MessageTicks status={msg.is_read ? 'read' : 'delivered'} className="ml-1" />}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />
                  }
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <MessageSquare size={28} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">Your messages</p>
              <p className="text-sm text-gray-400 mt-1">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}