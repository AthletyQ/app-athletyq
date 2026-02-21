// ============================================================
// DATABASE TYPES — mirrors your exact Supabase schema
// ============================================================

export type UserRole = "athlete" | "coach" | "wellness_professional";

// ── profiles ────────────────────────────────────────────────
export interface Profile {
  id: string;                        // UUID — matches auth.users(id)
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── sports ──────────────────────────────────────────────────
export interface Sport {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
}

// ── athletes ────────────────────────────────────────────────
export interface Athlete {
  user_id: string;                   // FK → profiles(id)
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_sport_id: number | null; // FK → sports(id)
  goals: string | null;
  injuries: string | null;
  created_at: string;
}

// ── coaches ─────────────────────────────────────────────────
export interface Coach {
  user_id: string;                   // FK → profiles(id)
  coaching_sport_id: number | null;
  specialization: string | null;
  bio: string | null;
  years_of_experience: number | null;
  hourly_rate: number | null;
  certifications: string[] | null;
  is_available: boolean;
  rating: number;
  total_sessions: number;
  created_at: string;
}

// ── wellness_professionals ───────────────────────────────────
export interface WellnessProfessional {
  user_id: string;
  specialty: string | null;
  bio: string | null;
  hourly_rate: number | null;
  certifications: string[] | null;
  created_at: string;
}

// ============================================================
// JOINED / COMPOSITE TYPES
// ── These are what services return after joining tables
// ============================================================

// Full athlete profile — profiles JOIN athletes JOIN sports
export interface AthleteProfile {
  // from profiles
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  // from athletes
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_sport_id: number | null;
  goals: string | null;
  injuries: string | null;
  // from sports (joined)
  sport: Sport | null;
}

// ============================================================
// UPDATE PAYLOAD TYPES
// ── Only the fields the athlete can actually edit
// ============================================================

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image_url?: string;
}

export interface UpdateAthletePayload {
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  preferred_sport_id?: number;
  goals?: string;
  injuries?: string;
}

// ============================================================
// SERVICE RESPONSE WRAPPER
// ── Every service returns { data, error } — never throws
// ============================================================

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}