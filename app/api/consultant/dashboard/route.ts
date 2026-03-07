import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all athletes with their sport info
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select(`
        user_id,
        age,
        height_cm,
        weight_kg,
        preferred_sport_id,
        goals,
        injuries,
        created_at,
        sports (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (athletesError) {
      return NextResponse.json(
        { ok: false, error: { message: athletesError.message } },
        { status: 500 }
      );
    }

    // Mock performance data (replace with real data later)
    const performanceData = {
      sprint100m: [
        { date: "Sep 2025", time: 11.2 },
        { date: "Oct 2025", time: 10.9 },
      ],
      sprint200m: [
        { date: "Sep 2025", time: 22.5 },
        { date: "Oct 2025", time: 22.1 },
      ],
      radarStats: {
        speed: 85,
        strength: 75,
        agility: 80,
        endurance: 70,
        vertical: 78,
      },
      injuries: {
        knee: 30,
        ankle: 25,
        hamstring: 20,
        other: 25,
      }
    };

    return NextResponse.json({
      ok: true,
      data: {
        athletes: athletes || [],
        performance: performanceData,
      }
    });

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}