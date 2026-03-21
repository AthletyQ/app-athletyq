import { NextRequest, NextResponse } from "next/server";
import { getAthleteProfile, ensureAthleteProfile } from "@/services/athlete/athlete.services";
import { supabase } from "@/lib/supabase/client";

/**
 * GET /api/athlete
 * Returns the full athlete profile for the currently authenticated user.
 */
export async function GET() {
  const { data, error } = await getAthleteProfile();

  if (error) {
    const status = error === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data }, { status: 200 });
}

/**
 * POST /api/athlete
 * Ensures an entry exists in the 'athletes' table for the current user.
 * This allows Coaches and Consultants to also book sessions.
 */
export async function POST(request: NextRequest) {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: "Missing authentication token" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await ensureAthleteProfile(user.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
