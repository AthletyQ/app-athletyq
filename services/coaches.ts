import type { Coach } from "../lib/types/dashboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// Mock data used as fallback when BE is not available
const MOCK_COACHES: Coach[] = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    specialty: "Sports Medicine",
    rating: 4.9,
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    isOnline: true,
    type: "doctor",
  },
  {
    id: 2,
    name: "Coach Mike Torres",
    specialty: "Strength & Conditioning",
    rating: 4.8,
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    isOnline: true,
    type: "coach",
  },
  {
    id: 3,
    name: "Dr. Emily Chen",
    specialty: "Physiotherapy",
    rating: 4.7,
    avatarUrl: "https://i.pravatar.cc/150?img=45",
    isOnline: false,
    type: "doctor",
  },
  {
    id: 4,
    name: "Coach James Park",
    specialty: "Athletic Performance",
    rating: 4.9,
    avatarUrl: "https://i.pravatar.cc/150?img=53",
    isOnline: true,
    type: "coach",
  },
  {
    id: 5,
    name: "Dr. Rachel Adams",
    specialty: "Orthopedics",
    rating: 4.6,
    avatarUrl: "https://i.pravatar.cc/150?img=20",
    isOnline: true,
    type: "doctor",
  },
  {
    id: 6,
    name: "Coach Lisa Wang",
    specialty: "Yoga & Recovery",
    rating: 4.8,
    avatarUrl: "https://i.pravatar.cc/150?img=38",
    isOnline: false,
    type: "coach",
  },
];

/** GET /api/coaches — falls back to mock data if BE is unavailable */
export async function getCoaches(): Promise<Coach[]> {
  if (!API_BASE) return MOCK_COACHES;

  try {
    const res = await fetch(`${API_BASE}/coaches`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json() as Promise<Coach[]>;
  } catch {
    console.warn("BE unavailable, using mock coaches data");
    return MOCK_COACHES;
  }
}