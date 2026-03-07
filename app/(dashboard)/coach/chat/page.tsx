'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bell, User, Search, Phone, Video, Star, MoreVertical,
  Paperclip, Smile, Send,
} from 'lucide-react'


type Message = {
  id: number
  text: string
  time: string
  fromMe: boolean
}

type Conversation = {
  id: number
  initials: string
  name: string
  preview: string
  time: string
  role: string
  roleColor: string
  online: boolean
  unread?: number
  color: string
  messages: Message[]
}


const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    initials: 'SJ',
    name: 'Sarah Johnson',
    preview: "Great progress! Let's schedu...",
    time: '2m ago',
    role: 'Coach',
    roleColor: 'bg-blue-100 text-blue-600',
    online: true,
    unread: 2,
    color: 'bg-blue-100 text-blue-700',
    messages: [
      { id: 1, text: 'Hi! How are you feeling today?', time: '10:30 AM', fromMe: false },
      { id: 2, text: "Feeling great! Ready for today's workout.", time: '10:32 AM', fromMe: true },
      { id: 3, text: "Excellent! Let's focus on endurance today.", time: '10:33 AM', fromMe: false },
      { id: 4, text: "Sounds good! What's the target distance?", time: '10:35 AM', fromMe: true },
      { id: 5, text: "We'll aim for 10K at zone 2 pace.", time: '10:36 AM', fromMe: false },
      { id: 6, text: "Great progress! Let's schedule your next session.", time: '10:45 AM', fromMe: false },
    ],
  },
  {
    id: 2,
    initials: 'MC',
    name: 'Marcus Chen',
    preview: "I've updated your training plan...",
    time: '1h ago',
    role: 'Coach',
    roleColor: 'bg-blue-100 text-blue-600',
    online: true,
    color: 'bg-indigo-100 text-indigo-700',
    messages: [
      { id: 1, text: "I've updated your training plan. Check it out!", time: '9:15 AM', fromMe: false },
      { id: 2, text: 'Thanks! Looks intense 😅', time: '9:20 AM', fromMe: true },
      { id: 3, text: "You can handle it. Let's crush it this week!", time: '9:22 AM', fromMe: false },
    ],
  },
  {
    id: 3,
    initials: 'ER',
    name: 'Emily Rodriguez',
    preview: 'Your nutrition plan is ready...',
    time: '3h ago',
    role: 'Consultant',
    roleColor: 'bg-purple-100 text-purple-600',
    online: false,
    unread: 1,
    color: 'bg-purple-100 text-purple-700',
    messages: [
      { id: 1, text: 'Your nutrition plan is ready for review!', time: '7:45 AM', fromMe: false },
      { id: 2, text: 'Perfect timing, I was just thinking about that.', time: '7:50 AM', fromMe: true },
    ],
  },
  {
    id: 4,
    initials: 'DK',
    name: 'David Kim',
    preview: 'See you at 5 PM for the session!',
    time: 'Yesterday',
    role: 'Coach',
    roleColor: 'bg-blue-100 text-blue-600',
    online: false,
    color: 'bg-amber-100 text-amber-700',
    messages: [
      { id: 1, text: 'See you at 5 PM for the session!', time: 'Yesterday', fromMe: false },
      { id: 2, text: "I'll be there!", time: 'Yesterday', fromMe: true },
    ],
  },
]

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

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


function ConversationItem({
  conv, selected, onClick,
}: {
  conv: Conversation
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${
        selected ? 'bg-blue-50 border-r-2 border-blue-600' : 'hover:bg-gray-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${conv.color}`}>
          {conv.initials}
        </div>
        {conv.online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{conv.name}</p>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mb-1.5">{conv.preview}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conv.roleColor}`}>
          {conv.role}
        </span>
      </div>
      {conv.unread && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold mt-1">
          {conv.unread}
        </span>
      )}
    </button>
  )
}


function ChatWindow({ conv }: { conv: Conversation }) {
  const [messages, setMessages] = useState<Message[]>(conv.messages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(conv.messages)
  }, [conv.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fromMe: true,
      },
    ])
    setInput('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
      {/* Chat header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${conv.color}`}>
              {conv.initials}
            </div>
            {conv.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{conv.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conv.roleColor}`}>
                {conv.role}
              </span>
            </div>
            <p className={`text-xs font-medium ${conv.online ? 'text-green-500' : 'text-gray-400'}`}>
              {conv.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[Phone, Video, Star, MoreVertical].map((Icon, i) => (
            <button key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">Today</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.fromMe
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
            }`}>
              {msg.text}
            </div>
            <span className="text-xs text-gray-400 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 p-1"><Paperclip className="w-5 h-5" /></button>
        <button className="text-gray-400 hover:text-gray-600 p-1"><Smile className="w-5 h-5" /></button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent focus:outline-none"
        />
        <button
          onClick={sendMessage}
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const [selected, setSelected] = useState<Conversation>(CONVERSATIONS[0])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Chats' | 'Calls'>('Chats')

  const filtered = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    // ← No Sidebar or outer wrapper — layout.tsx provides that
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />

      <div className="flex flex-1 min-h-0">
        
        <div className="w-56 flex flex-col bg-white border-r border-gray-100 flex-shrink-0">
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
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                selected={selected.id === conv.id}
                onClick={() => setSelected(conv)}
              />
            ))}
          </div>
        </div>

        {/* Chat window */}
        <ChatWindow conv={selected} />
      </div>
    </div>
  )
}