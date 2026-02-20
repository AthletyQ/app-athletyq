import type { ConsultationSession } from "@/lib/types/dashboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const MOCK_CONSULTATIONS: ConsultationSession[] = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    specialty: "Sports Medicine",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    date: "2026-02-15",
    time: "10:00 AM",
    notes: "Discussed knee recovery plan",
    status: "COMPLETED",
    type: "doctor",
  },
  {
    id: 2,
    name: "Dr. Emily Chen",
    specialty: "Physiotherapy",
    avatarUrl: "https://i.pravatar.cc/150?img=45",
    date: "2026-02-18",
    time: "11:00 AM",
    notes: "Follow-up on shoulder mobility exercises",
    status: "UPCOMING",
    type: "doctor",
  },
  {
    id: 3,
    name: "Dr. Rachel Adams",
    specialty: "Orthopedics",
    avatarUrl: "https://i.pravatar.cc/150?img=20",
    date: "2026-02-10",
    time: "9:00 AM",
    notes: "X-ray review, cleared for training",
    status: "COMPLETED",
    type: "doctor",
  },
  {
    id: 4,
    name: "Coach James Park",
    specialty: "Athletic Performance",
    avatarUrl: "https://i.pravatar.cc/150?img=53",
    date: "2026-02-20",
    time: "3:00 PM",
    notes: "Strength training program review",
    status: "UPCOMING",
    type: "coach",
  },
  {
    id: 5,
    name: "Coach Mike Torres",
    specialty: "Strength & Conditioning",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    date: "2026-02-08",
    time: "2:00 PM",
    notes: "Reviewed weekly conditioning plan",
    status: "COMPLETED",
    type: "coach",
  },
  {
    id: 6,
    name: "Coach Lisa Wang",
    specialty: "Yoga & Recovery",
    avatarUrl: "https://i.pravatar.cc/150?img=38",
    date: "2026-02-22",
    time: "4:00 PM",
    notes: "Recovery session and flexibility goals",
    status: "UPCOMING",
    type: "coach",
  },
];

/** GET /api/consultations */
export async function getConsultationSessions(): Promise<ConsultationSession[]> {
  if (!API_BASE) return MOCK_CONSULTATIONS;

  try {
    const res = await fetch(`${API_BASE}/consultations`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json() as Promise<ConsultationSession[]>;
  } catch {
    console.warn("BE unavailable, using mock consultations data");
    return MOCK_CONSULTATIONS;
  }
}