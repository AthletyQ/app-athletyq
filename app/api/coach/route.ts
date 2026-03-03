// app/api/coach/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search       = searchParams.get("search");
  const coachingType = searchParams.get("coachingType");
  const minPrice     = searchParams.get("minPrice");
  const maxPrice     = searchParams.get("maxPrice");
  const availability = searchParams.get("availability");
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
      profiles (
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

  if (coachingType) query = query.ilike("specialization", `%${coachingType}%`);
  if (minPrice)     query = query.gte("hourly_rate", parseFloat(minPrice));
  if (maxPrice)     query = query.lte("hourly_rate", parseFloat(maxPrice));
  if (availability === "available") query = query.eq("is_available", true);
  if (search)       query = query.ilike("bio", `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 });
  }

  const coaches = (data ?? []).map((row: any) => {
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
      specialization:    row.specialization,
      bio:               row.bio,
      yearsOfExperience: row.years_of_experience,
      hourlyRate:        row.hourly_rate,
      certifications:    row.certifications ?? [],
      isAvailable:       row.is_available,
      rating:            row.rating,
      totalSessions:     row.total_sessions,
      coachingSportId:   row.coaching_sport_id,
    };
  });

  // Fallback: also filter by name client-side if search is set
  const filtered = search
    ? coaches.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : coaches;

  return NextResponse.json({ coaches: filtered, total: count ?? 0, page, limit });
}