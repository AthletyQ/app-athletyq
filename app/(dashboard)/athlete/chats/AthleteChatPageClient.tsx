'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import {
  Send, Search, MessageSquare, Loader2, ArrowLeft,
  MoreVertical, Trash2, X,
} from 'lucide-react'
import { MessageTicks } from '@/components/chat/MessageTicks'
import { useSearchParams, useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

interface Profile { first_name: string; last_name: string; role: string }
interface Conversation {
  id: string; athlete_id: string; contact_id: string
  last_message: string | null; last_message_at: string | null
  unread_count: number; contact_unread_count: number; contact: Profile | null
}
interface Message {
  id: string; conversation_id: string; sender_id: string
  content: string; created_at: string; is_read: boolean
}

const AVATAR_COLORS = ['#6366F1','#8B5CF6','#0EA5E9','#10B981','#F59E0B','#EC4899']
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length] }
function initials(p: Profile | null) { if (!p) return '?'; return `${p.first_name?.[0]??''}${p.last_name?.[0]??''}`.toUpperCase() }
function fullName(p: Profile | null) { if (!p) return 'Unknown'; return `${p.first_name} ${p.last_name}`.trim() }
function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso), now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function DeleteModal({ name, onConfirm, onCancel, deleting }: {
  name: string; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Delete conversation?</h3>
        <p className="text-sm text-gray-500 mb-6">
          This will permanently delete your chat with <span className="font-semibold text-gray-700">{name}</span> and all messages.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AthleteChatPageClient() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const openWith     = searchParams.get('contactId') ?? searchParams.get('consultantId')

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filtered,      setFiltered]      = useState<Conversation[]>([])
  const [search,        setSearch]        = useState('')
  const [activeConv,    setActiveConv]    = useState<Conversation | null>(null)
  const [messages,      setMessages]      = useState<Message[]>([])
  const [newMessage,    setNewMessage]    = useState('')
  const [sending,       setSending]       = useState(false)
  const [loadingConvs,  setLoadingConvs]  = useState(true)
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)
  const [showList,      setShowList]      = useState(true)
  const [autoOpenDone,  setAutoOpenDone]  = useState(false)
  const [convMenuOpen,  setConvMenuOpen]  = useState<string | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<Conversation | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [hoveredMsg,    setHoveredMsg]    = useState<string | null>(null)
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const msgChannelRef  = useRef<RealtimeChannel | null>(null)
  const convChannelRef = useRef<RealtimeChannel | null>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const menuRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setCurrentUserId(user.id) })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setConvMenuOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchConversations = useCallback(async (userId: string) => {
    setLoadingConvs(true)
    const { data, error } = await supabase
      .from('conversations')
      .select(`id, athlete_id, contact_id, last_message, last_message_at, unread_count, contact_unread_count,
        contact:profiles!conversations_contact_id_fkey (first_name, last_name, role)`)
      .eq('athlete_id', userId)
      .order('last_message_at', { ascending: false })
    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shaped = data.map((c: any) => ({ ...c, contact: Array.isArray(c.contact) ? c.contact[0] ?? null : c.contact })) as Conversation[]
      setConversations(shaped); setFiltered(shaped)
    }
    setLoadingConvs(false)
  }, [])

  useEffect(() => { if (currentUserId) fetchConversations(currentUserId) }, [currentUserId, fetchConversations])

  useEffect(() => {
    if (!openWith || !currentUserId || autoOpenDone || loadingConvs) return
    const existing = conversations.find((c) => c.contact_id === openWith)
    if (existing) { openConversation(existing); setAutoOpenDone(true); router.replace('/athlete/chats') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWith, currentUserId, conversations, loadingConvs, autoOpenDone])

  useEffect(() => {
    if (!currentUserId) return
    convChannelRef.current?.unsubscribe()
    convChannelRef.current = supabase.channel(`athlete-convs-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `athlete_id=eq.${currentUserId}` },
        () => fetchConversations(currentUserId))
      .subscribe()
    return () => { convChannelRef.current?.unsubscribe() }
  }, [currentUserId, fetchConversations])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q ? conversations.filter((c) => fullName(c.contact).toLowerCase().includes(q) || (c.last_message ?? '').toLowerCase().includes(q)) : conversations)
  }, [search, conversations])

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    const { data, error } = await supabase.from('messages')
      .select('id, conversation_id, sender_id, content, created_at, is_read')
      .eq('conversation_id', convId).order('created_at', { ascending: true })
    if (!error && data) setMessages(data as Message[])
    setLoadingMsgs(false)
  }, [])

  const markAsRead = useCallback(async (convId: string, userId: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('conversation_id', convId).neq('sender_id', userId).eq('is_read', false)
    await supabase.from('conversations').update({ unread_count: 0 }).eq('id', convId)
  }, [])

  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv); setShowList(false)
    await fetchMessages(conv.id)
    if (currentUserId) await markAsRead(conv.id, currentUserId)
  }, [fetchMessages, markAsRead, currentUserId])

  const handleDeleteConversation = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await supabase.from('messages').delete().eq('conversation_id', deleteTarget.id)
      await supabase.from('conversations').delete().eq('id', deleteTarget.id)
      setConversations(prev => prev.filter(c => c.id !== deleteTarget.id))
      if (activeConv?.id === deleteTarget.id) { setActiveConv(null); setMessages([]); setShowList(true) }
    } catch (err) { console.error('Delete failed:', err) }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const handleDeleteMessage = async (msgId: string) => {
    setDeletingMsgId(msgId)
    try {
      await supabase.from('messages').delete().eq('id', msgId)
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch (err) { console.error('Delete message failed:', err) }
    finally { setDeletingMsgId(null); setHoveredMsg(null) }
  }

  useEffect(() => {
    if (!activeConv) return
    msgChannelRef.current?.unsubscribe()
    msgChannelRef.current = supabase
  .channel(`...-msgs-${activeConv.id}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public',
    table: 'messages', filter: `conversation_id=eq.${activeConv.id}`,
  }, (payload) => {
    const msg = payload.new as Message
    setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
    if (currentUserId && msg.sender_id !== currentUserId) markAsRead(activeConv.id, currentUserId)
  })
  // ── Listen for is_read updates (tick updates) ──
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public',
    table: 'messages', filter: `conversation_id=eq.${activeConv.id}`,
  }, (payload) => {
    const updated = payload.new as Message
    setMessages((prev) =>
      prev.map((m) => m.id === updated.id ? { ...m, is_read: updated.is_read } : m)
    )
  })
  .subscribe()
    return () => { msgChannelRef.current?.unsubscribe() }
  }, [activeConv, currentUserId, markAsRead])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    const content = newMessage.trim()
    if (!content || !activeConv || !currentUserId || sending) return
    setSending(true); setNewMessage('')
    const { error } = await supabase.from('messages').insert({ conversation_id: activeConv.id, sender_id: currentUserId, content, is_read: false })
    if (!error) {
      await supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString(), contact_unread_count: (activeConv.contact_unread_count ?? 0) + 1 }).eq('id', activeConv.id)
    }
    setSending(false); inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  return (
    <>
      {deleteTarget && (
        <DeleteModal name={fullName(deleteTarget.contact)} onConfirm={handleDeleteConversation} onCancel={() => setDeleteTarget(null)} deleting={deleting} />
      )}

      <div className="flex h-full bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Conversation List ── */}
        <div className={`flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 flex-shrink-0 ${showList ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search conversations..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
                <MessageSquare size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">No conversations yet</p>
                <p className="text-xs text-gray-300">Visit Coaches or Consultants to start a chat</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const isActive = activeConv?.id === conv.id
                const unread   = conv.unread_count ?? 0
                const menuOpen = convMenuOpen === conv.id
                return (
                  <div key={conv.id}
                    className={`group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 border-b border-gray-50 cursor-pointer ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                    onClick={() => openConversation(conv)}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(conv.contact_id) }}>
                      {initials(conv.contact)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{fullName(conv.contact)}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{conv.last_message ?? 'No messages yet'}</p>
                        {unread > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Three-dot menu */}
                    <div className="relative flex-shrink-0" ref={menuOpen ? menuRef : null}>
                      <button onClick={(e) => { e.stopPropagation(); setConvMenuOpen(menuOpen ? null : conv.id) }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv); setConvMenuOpen(null) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
        </div>

        {/* ── Message Window ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showList ? 'flex' : 'hidden md:flex'}`}>
          {activeConv ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                <button onClick={() => setShowList(true)} className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(activeConv.contact_id) }}>
                  {initials(activeConv.contact)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{fullName(activeConv.contact)}</p>
                  <p className="text-xs text-green-500 font-medium capitalize">{activeConv.contact?.role?.replace(/_/g, ' ') ?? 'Contact'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <MessageSquare size={32} className="text-gray-200" />
                    <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine     = msg.sender_id === currentUserId
                    const isHovered  = hoveredMsg === msg.id
                    const isDeleting = deletingMsgId === msg.id
                    return (
                      <div key={msg.id}
                        className={`flex items-end gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                        onMouseEnter={() => setHoveredMsg(msg.id)}
                        onMouseLeave={() => setHoveredMsg(null)}>
                        {!isMine && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mb-1"
                            style={{ backgroundColor: avatarColor(activeConv.contact_id) }}>
                            {initials(activeConv.contact)}
                          </div>
                        )}
                        {isMine && (
                          <button onClick={() => handleDeleteMessage(msg.id)} disabled={isDeleting}
                            className={`w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all flex-shrink-0 mb-1 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        )}
                        <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1 flex items-center gap-1">
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

              <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input ref={inputRef} type="text" placeholder="Type a message..." value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending} />
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center transition-colors flex-shrink-0">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <MessageSquare size={28} className="text-blue-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-700">Your messages</p>
                <p className="text-sm text-gray-400 mt-1">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}