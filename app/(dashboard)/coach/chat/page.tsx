'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bell, User, Search, Phone, Video, Star, MoreVertical,
  Paperclip, Smile, Send, PhoneIncoming, PhoneMissed, PhoneOutgoing
} from 'lucide-react'
import { getConversations, getMessages, sendMessage, getCallRecords } from '@/services/api'

const COACH_USER_ID = 'your-user-id-here'

type Message     = { id: number; text: string; time: string; fromMe: boolean }
type Conversation = { id: string; initials: string; name: string; preview: string; time: string; role: string; roleColor: string; online: boolean; unread?: number; color: string; messages: Message[] }
type CallRecord  = { id: number; initials: string; name: string; color: string; type: 'incoming' | 'outgoing' | 'missed'; duration: string; time: string; date: string }

const CALL_ICON = {
  incoming: { icon: PhoneIncoming, color: 'text-green-500' },
  outgoing: { icon: PhoneOutgoing, color: 'text-blue-500'  },
  missed:   { icon: PhoneMissed,   color: 'text-red-500'   },
}

function Topbar() {
  return (
    <header className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
      <button className="relative w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
      </button>
      <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
        <User className="w-4 h-4" />
      </button>
    </header>
  )
}

function ConversationItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${selected ? 'bg-blue-50 border-r-2 border-blue-600' : 'hover:bg-gray-50'}`}>
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${conv.color}`}>{conv.initials}</div>
        {conv.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{conv.name}</p>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mb-1.5">{conv.preview}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conv.roleColor}`}>{conv.role}</span>
      </div>
      {conv.unread ? (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold mt-1">{conv.unread}</span>
      ) : null}
    </button>
  )
}

function CallItem({ call, onClick, selected }: { call: CallRecord; onClick: () => void; selected: boolean }) {
  const { icon: CallIcon, color } = CALL_ICON[call.type]
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected ? 'bg-blue-50 border-r-2 border-blue-600' : 'hover:bg-gray-50'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${call.color}`}>{call.initials}</div>
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

function CallsPanel({ calls, onSelect, selectedId }: { calls: CallRecord[]; onSelect: (c: CallRecord) => void; selectedId?: number }) {
  const grouped = calls.reduce<Record<string, CallRecord[]>>((acc, call) => {
    if (!acc[call.date]) acc[call.date] = []
    acc[call.date].push(call)
    return acc
  }, {})
  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(grouped).map(([date, calls]) => (
        <div key={date}>
          <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
            <p className="text-xs font-semibold text-gray-400">{date}</p>
          </div>
          {calls.map(call => (
            <CallItem key={call.id} call={call} onClick={() => onSelect(call)} selected={call.id === selectedId} />
          ))}
        </div>
      ))}
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
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${call.color}`}>{call.initials}</div>
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

function ChatWindow({ conv, coachId }: { conv: Conversation; coachId: string }) {
  const [messages, setMessages] = useState<Message[]>(conv.messages)
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    getMessages(conv.id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conv.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
    try {
      const newMsg = await sendMessage(conv.id, text, coachId)
      setMessages(prev => [...prev, newMsg])
    } catch {
      // optimistic fallback
      setMessages(prev => [...prev, {
        id: prev.length + 1, text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fromMe: true,
      }])
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${conv.color}`}>{conv.initials}</div>
            {conv.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{conv.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conv.roleColor}`}>{conv.role}</span>
            </div>
            <p className={`text-xs font-medium ${conv.online ? 'text-green-500' : 'text-gray-400'}`}>
              {conv.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[Phone, Video, Star, MoreVertical].map((Icon, i) => (
            <button key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {loading ? (
          <p className="text-center text-xs text-gray-400">Loading messages...</p>
        ) : (
          <>
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">Today</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 p-1"><Paperclip className="w-5 h-5" /></button>
        <button className="text-gray-400 hover:text-gray-600 p-1"><Smile className="w-5 h-5" /></button>
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent focus:outline-none"
        />
        <button
          onClick={handleSend}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
            input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-default'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [calls,         setCalls]         = useState<CallRecord[]>([])
  const [selected,      setSelected]      = useState<Conversation | null>(null)
  const [search,        setSearch]        = useState('')
  const [activeTab,     setActiveTab]     = useState<'Chats' | 'Calls'>('Chats')
  const [selectedCall,  setSelectedCall]  = useState<CallRecord | null>(null)
  const [coachId,       setCoachId]       = useState('')
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    fetch(`/api/coach/profile?userId=${COACH_USER_ID}`)
      .then(r => r.json())
      .then(async (profile) => {
        setCoachId(profile.id)
        const [convs, callRecords] = await Promise.all([
          getConversations(profile.id),
          getCallRecords(profile.id),
        ])
        setConversations(convs)
        setCalls(callRecords)
        if (convs.length > 0) setSelected(convs[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex flex-1 min-h-0">
        <div className="w-72 flex flex-col bg-white border-r border-gray-100 flex-shrink-0">
          <div className="px-3 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text" placeholder="Search conversations..."
                value={search} onChange={(e) => setSearch(e.target.value)}
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
          {activeTab === 'Chats' ? (
            <div className="flex-1 overflow-y-auto">
              {filtered.map((conv) => (
                <ConversationItem
                  key={conv.id} conv={conv}
                  selected={selected?.id === conv.id}
                  onClick={() => setSelected(conv)}
                />
              ))}
            </div>
          ) : (
            <CallsPanel calls={calls} onSelect={setSelectedCall} selectedId={selectedCall?.id} />
          )}
        </div>

        {activeTab === 'Chats' ? (
          selected ? <ChatWindow conv={selected} coachId={coachId} /> : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <p className="text-sm text-gray-400">Select a conversation</p>
            </div>
          )
        ) : selectedCall ? (
          <CallDetailPanel call={selectedCall} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Phone className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-400">Select a call to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}