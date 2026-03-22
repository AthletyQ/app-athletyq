
export interface Consultant {
 
  id: string;

 
  firstName: string;
  lastName: string;
  initials: string;
  avatarUrl?: string | null;


  specialty: string;


  bio: string | null;


  hourlyRate: number | null;

 
  certifications: string[];


  rating: number | null;
  totalSessions: number | null;
  yearsOfExperience: number | null;
}


export interface ConsultantsResponse {
  consultants: Consultant[];
  total: number;
}

export interface ConsultantFilters {
  specialty?: string;
  minPrice?: number;
  maxPrice?: number;
}