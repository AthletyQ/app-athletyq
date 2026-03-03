export type ContactRole = "Coach" | "Consultant";

export interface ChatContact {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: ContactRole;
  isOnline: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

export interface Conversation {
  id: string;
  contact: ChatContact;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}