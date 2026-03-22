'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import {
  Star, MoreVertical, Paperclip, Smile, Send,
  Loader2, MessageSquare, ArrowLeft, Search, Trash2, X,
  FileText, Film,
} from 'lucide-react'
import { MessageTicks } from '@/components/chat/MessageTicks'


interface Profile { first_name: string; last_name: string }

interface Conversation {
  id: string; athlete_id: string; contact_id: string
  last_message: string | null; last_message_at: string | null
  unread_count: number; contact_unread_count: number; athlete: Profile | null
}

interface Message {
  id: string; conversation_id: string; sender_id: string
  content: string; created_at: string; is_read: boolean
  attachment_url?: string | null; attachment_name?: string | null; attachment_type?: string | null
}

interface PendingFile { file: File; previewUrl: string | null }


const AVATAR_COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EC4899','#6366F1']
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

const STARRED_KEY = 'athletyq_consultant_starred_convs'
function loadStarred(): Set<string> {
  try { const r = localStorage.getItem(STARRED_KEY); return r ? new Set(JSON.parse(r)) : new Set() } catch { return new Set() }
}
function saveStarred(s: Set<string>) {
  try { localStorage.setItem(STARRED_KEY, JSON.stringify([...s])) } catch {}
}



const EMOJI_CATEGORIES: Record<string, string[]> = {
  '😀': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','💫','🤯','🤠','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  '👋': ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','🫦','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💋','💌','💤','💢','💬','💭','💯'],
  '🎉': ['🎉','🎊','🎈','🎁','🎀','🎗','🎟','🎫','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🪗','🎸','🎹','🎺','🎻','🪘','🥁','🎯','🎱','🎮','🕹','🎲','♟','🎰','🧩','🪀','🪁'],
  '🌍': ['🌍','🌎','🌏','🌐','🗺','🧭','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🧱','🛖','🏘','🏚','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩','🕋','⛲','⛺','🌁','🌃','🏙','🌄','🌅','🌆','🌇','🌉','🌌','🌠','🎇','🎆','🌈','⚡','❄️','☃️','⛄','🔥','💧','🌊'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🦆','🐧','🐦','🐤','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔'],
  '🍎': ['🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍑','🍒','🍌','🍉','🥭','🍍','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶','🫑','🥒','🥬','🥦','🧄','🧅','🍄','🥜','🌰','🍞','🥐','🥖','🫓','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🌮','🌯','🥙','🧆','🍜','🍝','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥮','🍡','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🍯','🧃','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
  '✈️': ['✈️','🚀','🛸','🚁','🛶','⛵','🚤','🛥','🛳','🚢','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚍','🚎','🏎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗','🚘','🚙','🛻','🚚','🚛','🚜','🏍','🛵','🚲','🛴','🛹','🛼','⛽','🚨','🚥','🚦','🚧','⚓','🛟','🪂','💺','🚟','🚠','🚡'],
  '💡': ['⌚','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🧭','⏱','⏲','⏰','🕰','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯','🪔','🧯','💰','💴','💵','💶','💷','💸','💳','🪙','💹','📈','📉','📊','📋','🗒','🗓','📆','📅','🗑','📁','📂','🗂','📄','📃','📑','🧾','📌','📍','📎','🖇','📏','📐','✂️','🔍','🔎','🔏','🔐','🔒','🔓'],
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState('😀')
  const ref           = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return (
    <div ref={ref} className="absolute bottom-14 left-0 z-30 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex border-b border-gray-100 px-1 pt-1.5 gap-0.5 overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button key={cat} onClick={() => setTab(cat)}
            className={`flex-shrink-0 px-2 py-1.5 text-base rounded-lg transition-colors ${tab === cat ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="p-2 grid grid-cols-9 gap-0.5 max-h-52 overflow-y-auto">
        {EMOJI_CATEGORIES[tab].map((emoji, i) => (
          <button key={`${emoji}-${i}`} onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function AttachmentBubble({ url, name, type, isMine }: { url: string; name: string; type: string; isMine: boolean }) {
  if (type.startsWith('image/')) return (
    <a href={url} target="_blank" rel="noreferrer" className="block mt-1 max-w-[200px]">
      <img src={url} alt={name} className="rounded-xl border border-white/20 object-cover w-full" />
    </a>
  )
  if (type.startsWith('video/')) return (
    <a href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 mt-1 text-xs underline ${isMine ? 'text-blue-100' : 'text-blue-600'}`}>
      <Film className="w-3.5 h-3.5" />{name}
    </a>
  )
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-1.5 mt-1 text-xs font-medium px-3 py-2 rounded-xl ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
      <FileText className="w-4 h-4 flex-shrink-0" />
      <span className="truncate max-w-[160px]">{name}</span>
    </a>
  )
}

function FilePreviewBar({ pending, onRemove }: { pending: PendingFile; onRemove: () => void }) {
  const isImage = pending.file.type.startsWith('image/')
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-t border-blue-100">
      <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {isImage && pending.previewUrl
          ? <img src={pending.previewUrl} className="w-full h-full object-cover rounded-xl" alt="" />
          : <FileText className="w-5 h-5 text-blue-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{pending.file.name}</p>
        <p className="text-xs text-gray-400">{(pending.file.size / 1024).toFixed(1)} KB</p>
      </div>
      <button onClick={onRemove} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
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



export default function ConsultantChatsClient() {
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
  const [autoOpened,     setAutoOpened]     = useState(false)
  const [convMenuOpen,   setConvMenuOpen]   = useState<string | null>(null)
  const [deleteTarget,   setDeleteTarget]   = useState<Conversation | null>(null)
  const [deleting,       setDeleting]       = useState(false)
  const [showEmoji,      setShowEmoji]      = useState(false)
  const [pendingFile,    setPendingFile]    = useState<PendingFile | null>(null)
  const [uploadingFile,  setUploadingFile]  = useState(false)
  const [starred,        setStarred]        = useState<Set<string>>(new Set())
  const [hoveredMsg,     setHoveredMsg]     = useState<string | null>(null)
  const [deletingMsgId,  setDeletingMsgId]  = useState<string | null>(null)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const msgChannelRef  = useRef<RealtimeChannel | null>(null)
  const convChannelRef = useRef<RealtimeChannel | null>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const menuRef        = useRef<HTMLDivElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => { setStarred(loadStarred()) }, [])

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
        athlete:profiles!conversations_athlete_id_fkey (first_name, last_name)`)
      .eq('contact_id', userId)
      .order('last_message_at', { ascending: false })
    if (!error && data) {
      const shaped = data.map((c: any) => ({ ...c, athlete: Array.isArray(c.athlete) ? c.athlete[0] ?? null : c.athlete })) as Conversation[]
      setConversations(shaped)
    }
    setLoadingConvs(false)
  }, [])

  useEffect(() => { if (currentUserId) fetchConversations(currentUserId) }, [currentUserId, fetchConversations])

  useEffect(() => {
    if (autoOpened || !targetConversationId || conversations.length === 0) return
    const target = conversations.find((c) => c.id === targetConversationId)
    if (target) { openConversation(target); setAutoOpened(true) }

  }, [conversations, targetConversationId, autoOpened])

  useEffect(() => {
    if (!currentUserId) return
    convChannelRef.current?.unsubscribe()
    convChannelRef.current = supabase.channel(`consultant-convs-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `contact_id=eq.${currentUserId}` },
        () => fetchConversations(currentUserId))
      .subscribe()
    return () => { convChannelRef.current?.unsubscribe() }
  }, [currentUserId, fetchConversations])

  useEffect(() => {
    const q = search.toLowerCase()
    const base = q
      ? conversations.filter((c) =>
          fullName(c.athlete).toLowerCase().includes(q) ||
          (c.last_message ?? '').toLowerCase().includes(q))
      : [...conversations]
    base.sort((a, b) => {
      const aS = starred.has(a.id) ? 1 : 0
      const bS = starred.has(b.id) ? 1 : 0
      if (bS !== aS) return bS - aS
      return new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime()
    })
    setFiltered(base)
  }, [search, conversations, starred])

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    const { data, error } = await supabase.from('messages')
      .select('id, conversation_id, sender_id, content, created_at, is_read, attachment_url, attachment_name, attachment_type')
      .eq('conversation_id', convId).order('created_at', { ascending: true })
    if (!error && data) setMessages(data as Message[])
    setLoadingMsgs(false)
  }, [])

  const markAsRead = useCallback(async (convId: string, userId: string) => {
    await supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', convId).neq('sender_id', userId).eq('is_read', false)
    await supabase.from('conversations').update({ contact_unread_count: 0 }).eq('id', convId)
  }, [])

  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv); setShowList(false); setShowEmoji(false); setPendingFile(null)
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

  function toggleStar(convId: string) {
    setStarred(prev => {
      const next = new Set(prev)
      next.has(convId) ? next.delete(convId) : next.add(convId)
      saveStarred(next); return next
    })
  }

  useEffect(() => {
  if (!activeConv) return
  msgChannelRef.current?.unsubscribe()
  msgChannelRef.current = supabase
    .channel(`consultant-msgs-${activeConv.id}`)   
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public',
      table: 'messages', filter: `conversation_id=eq.${activeConv.id}`,
    }, (payload) => {
      const msg = payload.new as Message
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      if (currentUserId && msg.sender_id !== currentUserId) markAsRead(activeConv.id, currentUserId)
    })

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    setPendingFile({ file, previewUrl })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async () => {
    const text = newMessage.trim()
    if (!text && !pendingFile) return
    if (!activeConv || !currentUserId || sending) return

    setSending(true)
    let attachmentUrl: string | undefined
    let attachmentName: string | undefined
    let attachmentType: string | undefined

    if (pendingFile) {
      setUploadingFile(true)
      try {
        const ext  = pendingFile.file.name.split('.').pop()
        const path = `chat-attachments/${activeConv.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('attachments').upload(path, pendingFile.file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path)
        attachmentUrl = publicUrl; attachmentName = pendingFile.file.name; attachmentType = pendingFile.file.type
        if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl)
        setPendingFile(null)
      } catch (err) { console.error('Upload failed:', err); setSending(false); setUploadingFile(false); return }
      setUploadingFile(false)
    }

    setNewMessage('')
    const payload: any = { conversation_id: activeConv.id, sender_id: currentUserId, content: text || '', is_read: false }
    if (attachmentUrl)  payload.attachment_url  = attachmentUrl
    if (attachmentName) payload.attachment_name = attachmentName
    if (attachmentType) payload.attachment_type = attachmentType

    const { error } = await supabase.from('messages').insert(payload)
    if (!error) {
      await supabase.from('conversations').update({
        last_message: text || (attachmentName ?? 'Attachment'),
        last_message_at: new Date().toISOString(),
        unread_count: (activeConv.unread_count ?? 0) + 1,
      }).eq('id', activeConv.id)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      {deleteTarget && (
        <DeleteModal name={fullName(deleteTarget.athlete)} onConfirm={handleDeleteConversation}
          onCancel={() => setDeleteTarget(null)} deleting={deleting} />
      )}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />

      <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">

       
        <div className={`flex flex-col w-full md:w-96 border-r border-gray-200 flex-shrink-0 bg-white ${showList ? 'flex' : 'hidden md:flex'}`}>
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search conversations..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder:text-gray-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
                <MessageSquare size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">No conversations yet</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const isActive  = activeConv?.id === conv.id
                const unread    = conv.contact_unread_count ?? 0
                const menuOpen  = convMenuOpen === conv.id
                const isStarred = starred.has(conv.id)
                return (
                  <div key={conv.id}
                    className={`group relative flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${isActive ? 'bg-blue-50' : ''}`}
                    onClick={() => openConversation(conv)}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(conv.athlete_id) }}>{initials(conv.athlete)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>{fullName(conv.athlete)}</span>
                          {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-sm truncate ${unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>{conv.last_message ?? 'No messages yet'}</p>
                        {unread > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
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

       
        <div className={`flex-1 flex flex-col min-w-0 ${!showList ? 'flex' : 'hidden md:flex'}`}>
          {activeConv ? (
            <>
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowList(true)} className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(activeConv.athlete_id) }}>{initials(activeConv.athlete)}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{fullName(activeConv.athlete)}</p>
                    <p className="text-xs text-green-500 font-medium">Athlete</p>
                  </div>
                </div>
                <button onClick={() => toggleStar(activeConv.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  title={starred.has(activeConv.id) ? 'Unstar' : 'Star conversation'}>
                  <Star className={`w-4 h-4 transition-colors ${starred.has(activeConv.id) ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">No messages yet. Say hello!</p></div>
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
                            style={{ backgroundColor: avatarColor(activeConv.athlete_id) }}>{initials(activeConv.athlete)}</div>
                        )}
                        {isMine && (
                          <button onClick={() => handleDeleteMessage(msg.id)} disabled={isDeleting}
                            className={`w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all flex-shrink-0 mb-1 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        )}
                        <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'}`}>
                            {msg.content && <p>{msg.content}</p>}
                            {msg.attachment_url && (
                              <AttachmentBubble url={msg.attachment_url} name={msg.attachment_name ?? 'file'}
                                type={msg.attachment_type ?? 'application/octet-stream'} isMine={isMine} />
                            )}
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

              {pendingFile && (
                <FilePreviewBar pending={pendingFile} onRemove={() => {
                  if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl)
                  setPendingFile(null)
                }} />
              )}

              <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
                <div className="relative flex items-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="text-gray-400 hover:text-blue-500 p-1 transition-colors flex-shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="relative flex-shrink-0">
                    <button onClick={() => setShowEmoji(prev => !prev)}
                      className={`p-1 transition-colors ${showEmoji ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}>
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmoji && (
                      <EmojiPicker
                        onSelect={(emoji) => { setNewMessage(prev => prev + emoji); inputRef.current?.focus() }}
                        onClose={() => setShowEmoji(false)}
                      />
                    )}
                  </div>
                  <input ref={inputRef} type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent focus:outline-none"
                    disabled={sending} />
                  <button onClick={sendMessage}
                    disabled={(!newMessage.trim() && !pendingFile) || sending || uploadingFile}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${(newMessage.trim() || pendingFile) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-default'}`}>
                    {(sending || uploadingFile) ? <Loader2 size={16} className="animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-300" />
                </div>
                <p className="text-base font-semibold text-gray-700 mb-1">Your messages</p>
                <p className="text-sm text-gray-400">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
