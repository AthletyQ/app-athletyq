import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sportId      = searchParams.get("sport");       // sports.id (integer)
  const search       = searchParams.get("search");
  const minPrice     = searchParams.get("minPrice");
  const maxPrice     = searchParams.get("maxPrice");
  const page         = parseInt(searchParams.get("page")  || "1");
  const limit        = parseInt(searchParams.get("limit") || "10");

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let query = supabase
    .from("coaches")
    .select(
      ` 
      user_id,
      coaching_sport_id,
      specialization,
      bio,
      years_of_experience,
      hourly_rate,
      certifications,
      is_available,
      rating,
      total_sessions,
      sports (
        id,
        name
      ),
      profiles!coaches_user_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        profile_image_url
      )
      `,
      { count: "exact" }
    )
    .range(from, to);

  // Filter by sport id
  if (sportId) {
    query = query.eq("coaching_sport_id", parseInt(sportId));
  }

  // Filter by hourly rate
  if (minPrice) query = query.gte("hourly_rate", parseFloat(minPrice));
  if (maxPrice) query = query.lte("hourly_rate", parseFloat(maxPrice));

  // Filter by availability
  query = query.eq("is_available", true);

  // Search by bio or specialization
  if (search) {
    query = query.or(`bio.ilike.%${search}%,specialization.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 });
  }

  interface CoachQueryResult {
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
    sports: { id: number; name: string } | null;
    profiles: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string | null;
      profile_image_url: string | null;
    } | null;
  }

  const coaches = ((data as unknown as CoachQueryResult[]) ?? []).map((row) => {
    const profile   = row.profiles;
    const firstName = profile?.first_name ?? "";
    const lastName  = profile?.last_name  ?? "";

    return {
      id:                row.user_id,
      firstName,
      lastName,
      initials:          `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
      email:             profile?.email             ?? "",
      phoneNumber:       profile?.phone_number      ?? "",
      profileImageUrl:   profile?.profile_image_url ?? null,
      sport:             row.sports?.name           ?? "General",
      sportId:           row.coaching_sport_id,
      specialization:    row.specialization,
      bio:               row.bio,
      yearsOfExperience: row.years_of_experience,
      hourlyRate:        row.hourly_rate,
      certifications:    row.certifications         ?? [],
      isAvailable:       row.is_available,
      rating:            row.rating,
      totalSessions:     row.total_sessions,
    };
  });

  // Client-side name search fallback
  const filtered = search
    ? coaches.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : coaches;

  return NextResponse.json({ coaches: filtered, total: count ?? 0, page, limit });
}