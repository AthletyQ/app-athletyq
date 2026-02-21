import { getAthleteProfile } from "@/services/athlete/athlete.services";
import { NextResponse } from "next/server";

/**
 * GET /api/athletes
 * Returns the full athlete profile (profiles + athletes + sports joined)
 * for the currently authenticated user.
 */
export async function GET() {
  const { data, error } = await getAthleteProfile();

  if (error) {
    const status = error === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data }, { status: 200 });
}