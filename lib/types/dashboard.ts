export interface DashboardStats {
  trainingProgress: number;      // e.g. 72
  trainingLabel: string;         // e.g. "Weekly target"
  injuryRecovery: number;        // e.g. 85
  injuryLabel: string;           // e.g. "Left knee rehab"
  upcomingConsultsCount: number; // e.g. 3
  activeDays: number;            // e.g. 5
  activeDaysTotal: number;       // e.g. 7
}

export interface WeeklyActivityEntry {
  day: string;   // e.g. "Mon"
  value: number; // e.g. 75
}

export interface CaloriesEntry {
  day: string;      // e.g. "Mon"
  calories: number; // e.g. 480
}

export interface Consultation {
  id: number | string;
  name: string;      // e.g. "Dr. Emily Chen"
  role: string;      // e.g. "Physiotherapy"
  avatarUrl: string; // full image URL
  date: string;      // e.g. "2026-02-18"
  time: string;      // e.g. "11:00 AM"
}

// ── Coaches ─────────────────────────────────────────────────
export interface Coach {
  id: number | string;
  name: string;        // e.g. "Dr. Sarah Mitchell"
  specialty: string;   // e.g. "Sports Medicine"
  rating: number;      // e.g. 4.9
  avatarUrl: string;   // full image URL
  isOnline: boolean;
  type: "doctor" | "coach";
}

// ── Consultations Page ──────────────────────────────────────
export interface ConsultationSession {
  id: number | string;
  name: string;          // e.g. "Dr. Sarah Mitchell"
  specialty: string;     // e.g. "Sports Medicine"
  avatarUrl: string;
  date: string;          // e.g. "2026-02-15"
  time: string;          // e.g. "10:00 AM"
  notes: string;         // e.g. "Discussed knee recovery plan"
  status: "COMPLETED" | "UPCOMING" | "CANCELLED";
  type: "doctor" | "coach";
}

// ── Chat ────────────────────────────────────────────────────
export interface ChatMessage {
  id: number | string;
  senderId: string;       // "me" or the contact's id
  text: string;
  time: string;           // e.g. "2:15 PM"
}

export interface ChatContact {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  lastMessage: string;
  lastTime: string;       // e.g. "2:30 PM" | "Yesterday"
  unread: number;
  messages: ChatMessage[];
}