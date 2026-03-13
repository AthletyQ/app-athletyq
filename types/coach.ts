export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  email: string;
  phoneNumber: string;
  profileImageUrl: string | null;
  sport: string;
  sportId: number;
  specialization: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  hourlyRate: number | null;
  certifications: string[];
  isAvailable: boolean;
  rating: number | null;
  totalSessions: number | null;
}

export interface CoachFilters {
  sport?: string;
  experienceLevel?: string;
  coachingType?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  search?: string;
}

export interface CoachesResponse {
  coaches: Coach[];
  total: number;
  page: number;
  limit: number;
}