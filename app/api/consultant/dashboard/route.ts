import { NextRequest, NextResponse } from "next/server";
import { getAthletes, getTotalAthletes } from "@/services/consultant/consultant.services";

export async function GET(request: NextRequest) {
  try {

   
    const consultantId = request.nextUrl.searchParams.get("consultant_id");
    if (!consultantId) {
      return NextResponse.json(
        { ok: false, error: { message: "consultant_id is required" } },
        { status: 400 }
      );
    }
    const athletes = await getAthletes();
    const totalAthletes = await getTotalAthletes(consultantId);

    return NextResponse.json({
      ok: true,
      data: {
        athletes,
        totalAthletes,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}