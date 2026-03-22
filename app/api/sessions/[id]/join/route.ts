
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const coachId = searchParams.get("coachId");
  const athleteId = searchParams.get("athleteId");

  if (coachId) {
   
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, scheduled_at, duration_minutes, status, sport_id, session_type,
        provider_id, athlete_id, location_details, confirmed_at, cancelled_at,
        athletes!sessions_athlete_id_fkey(
          profiles!athletes_user_id_fkey(first_name, last_name, profile_image_url)
        )
      `)
      .eq("provider_id", coachId)
      .order("scheduled_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (athleteId) {
    
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, scheduled_at, duration_minutes, status, sport_id, session_type,
        provider_id, athlete_id, location_details,
        coaches!sessions_provider_id_fkey(
          profiles!coaches_user_id_fkey(first_name, last_name, profile_image_url)
        )
      `)
      .eq("athlete_id", athleteId)
      .order("scheduled_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Missing coachId or athleteId" }, { status: 400 });
}
