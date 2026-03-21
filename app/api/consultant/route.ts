import { NextRequest, NextResponse } from "next/server";
import { 
  getAthletes, 
  getTotalAthletes, 
  getUpcomingSessions, 
  getNewMessages,
  getConsultantProfile,
  getEarningsSummary,
  getAthleteActivity
} from "@/services/consultant/consultant.services";

export async function GET(request: NextRequest) {
  try {
    const consultantId = request.nextUrl.searchParams.get("consultant_id");
    if (!consultantId) {
      return NextResponse.json(
        { ok: false, error: { message: "consultant_id is required" } },
        { status: 400 }
      );
    }

    const [athletes, totalAthletes, upcomingSessions, newMessages, profile, earnings, activity] = await Promise.all([
    getAthletes(),
    getTotalAthletes(consultantId),
    getUpcomingSessions(consultantId),
    getNewMessages(consultantId),
    getConsultantProfile(consultantId),
    getEarningsSummary(consultantId),
    getAthleteActivity(consultantId),
  ]);

    return NextResponse.json({
    ok: true,
    data: {
      athletes,
      totalAthletes,
      upcomingSessions,
      newMessages,
      profile,
      earnings,
      activity,
    }
  });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}