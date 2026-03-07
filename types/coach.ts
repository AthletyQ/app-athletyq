export type CoachingType = "Online" | "In-person" | "Hybrid" | "Online & In-person";

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  avatarColor: string;
  sports: string[];
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  coachingType: CoachingType;
  bio: string;
  pricePerSession: number;
  availability: string[];
  verified: boolean;
}

export interface CoachFilters {
  sport?: string;
  experienceLevel?: string;
  coachingType?: CoachingType;
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