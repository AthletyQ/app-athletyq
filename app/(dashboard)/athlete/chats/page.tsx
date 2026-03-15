"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Conversation } from "@/types/chat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageSquare } from "lucide-react";

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);


  // Get current logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // Fetch conversations
  useEffect(() => {
    if (!currentUserId) return;

    fetch(`/api/conversations?athleteId=${currentUserId}`)
      .then((r) => r.json())
      .then(({ conversations: data }) => {
        setConversations(data ?? []);
        if (data?.length > 0) setSelectedId(data[0].id);
      });
  }, [currentUserId]);

  // Realtime: update conversation list when last_message changes
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `athlete_id=eq.${currentUserId}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            last_message: string | null;
            last_message_at: string;
          };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === updated.id
                ? { ...c, lastMessage: updated.last_message, lastMessageAt: updated.last_message_at }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {selectedConversation && currentUserId ? (
        <ChatWindow
          key={selectedConversation.id}
          conversation={selectedConversation}
          currentUserId={currentUserId}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <MessageSquare size={40} strokeWidth={1.5} />
          <p className="text-sm">
            {conversations.length === 0
              ? "No conversations yet"
              : "Select a conversation to start chatting"}
          </p>
        </div>
      )}
    </div>
  );
}