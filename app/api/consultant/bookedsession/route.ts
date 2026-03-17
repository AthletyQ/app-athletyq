import { NextRequest, NextResponse } from "next/server";
import { getSessionStats, getConsultantSessions } from "@/services/consultant/consultant.services";

export async function GET(request: NextRequest) {
  try {
    const consultantId = request.nextUrl.searchParams.get("consultant_id");

    if (!consultantId) {
      return NextResponse.json(
        { ok: false, error: { message: "consultant_id is required" } },
        { status: 400 }
      );
    }

    const [stats, sessions] = await Promise.all([
      getSessionStats(consultantId),
      getConsultantSessions(consultantId),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        ...stats,
        sessions,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}
