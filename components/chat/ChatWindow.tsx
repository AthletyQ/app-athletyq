"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Video, Star, MoreVertical, Paperclip, Smile, Send } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Conversation, Message } from "@/types/chat";

const AVATAR_COLORS: Record<string, string> = {
  Coach: "#3B82F6",
  Consultant: "#10B981",
};

interface Props {
  conversation: Conversation;
  currentUserId: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatWindow({ conversation, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(true);
  const bottomRef               = useRef<HTMLDivElement>(null);
  

  // Fetch messages on conversation change
  useEffect(() => {
    fetch(`/api/messages?conversationId=${conversation.id}`)
      .then((r) => r.json())
      .then(({ messages: rows }) => {
        setMessages(
          ((rows as MessageRow[]) ?? []).map((m) => ({
            id:             m.id,
            conversationId: m.conversation_id,
            senderId:       m.sender_id,
            content:        m.content,
            createdAt:      m.created_at,
            isOwn:          m.sender_id === currentUserId,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [conversation.id, currentUserId]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const m = payload.new as MessageRow;
          setMessages((prev) => [
            ...prev,
            {
              id:             m.id,
              conversationId: m.conversation_id,
              senderId:       m.sender_id,
              content:        m.content,
              createdAt:      m.created_at,
              isOwn:          m.sender_id === currentUserId,
            },
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, currentUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversation.id,
        senderId: currentUserId,
        content,
      }),
    });
    // Realtime will handle adding the message to state
  };

  const { contact } = conversation;

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ backgroundColor: AVATAR_COLORS[contact.role] ?? "#6366F1" }}
          >
            {contact.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {contact.firstName} {contact.lastName}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                contact.role === "Coach"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}>
                {contact.role}
              </span>
            </div>
            <p className="text-xs text-green-500 font-medium">
              {contact.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[Phone, Video, Star, MoreVertical].map((Icon, i) => (
            <button key={i} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Icon size={17} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isOwn
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
          <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <Paperclip size={17} />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <Smile size={17} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              input.trim() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400"
            }`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}