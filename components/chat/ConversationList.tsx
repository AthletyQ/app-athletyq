"use client";

import { Conversation } from "@/types/chat";
import { Search } from "lucide-react";
import { useState } from "react";

const AVATAR_COLORS: Record<string, string> = {
  Coach: "#3B82F6",
  Consultant: "#10B981",
};

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: Props) {
  const [tab, setTab]       = useState<"chats" | "calls">("chats");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    `${c.contact.firstName} ${c.contact.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-white">
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex px-4 gap-4 border-b border-gray-100">
        {(["chats", "calls"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8">No conversations yet.</p>
        )}
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
              selectedId === conv.id ? "bg-blue-50" : ""
            }`}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: AVATAR_COLORS[conv.contact.role] ?? "#6366F1" }}
              >
                {conv.contact.initials}
              </div>
              {conv.contact.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {conv.contact.firstName} {conv.contact.lastName}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                  {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-1">{conv.lastMessage}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  conv.contact.role === "Coach"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}>
                  {conv.contact.role}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}