

export type UserRole = "athlete" | "coach" | "wellness_professional";


export interface Profile {
  id: string;                        
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}


export interface Sport {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
}


export interface Athlete {
  user_id: string;                   
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_sport_id: number | null; 
  goals: string | null;
  injuries: string | null;
  created_at: string;
}


export interface Coach {
  user_id: string;                   
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


export interface WellnessProfessional {
  user_id: string;
  specialty: string | null;
  bio: string | null;
  hourly_rate: number | null;
  certifications: string[] | null;
  created_at: string;
}


export interface Availability {
  id: number;
  provider_id: string;
  provider_type: "coach" | "consultant";
  day_of_week: number;
  start_time: string;
  end_time: string;
  specific_date: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}


export interface Session {
  id: number;
  athlete_id: string;
  provider_id: string;
  provider_type: "coach" | "consultant";
  sport_id: number | null;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  price: number;
  currency: string;
  payment_status: "unpaid" | "paid" | "refunded" | "pending";
  location_type: "online" | "in_person" | "hybrid";
  location_details: string | null;
  athlete_notes: string | null;
  provider_notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
}


export interface AthleteProfile {

  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;

  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_sport_id: number | null;
  goals: string | null;
  injuries: string | null;

  sport: Sport | null;
}



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



export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}