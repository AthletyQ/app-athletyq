// ─── Matches the actual `consultants` Supabase table ─────────────────────────
// Columns: user_id, specialty, bio, hourly_rate, certifications, created_at
// Names come from a joined `profiles` table (first_name, last_name, avatar_url)

export interface Consultant {
  /** consultant.user_id */
  id: string;

  // from profiles join
  firstName: string;
  lastName: string;
  initials: string;
  avatarUrl?: string | null;

  /** consultant.specialty */
  specialty: string;

  /** consultant.bio */
  bio: string | null;

  /** consultant.hourly_rate */
  hourlyRate: number | null;

  /** consultant.certifications (text[]) */
  certifications: string[];

  // Stats
  rating: number | null;
  totalSessions: number | null;
  yearsOfExperience: number | null;
}

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface ConsultantsResponse {
  consultants: Consultant[];
  total: number;
}

export interface ConsultantFilters {
  specialty?: string;
  minPrice?: number;
  maxPrice?: number;
}