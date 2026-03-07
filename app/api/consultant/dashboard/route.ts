import { NextRequest, NextResponse } from "next/server";
import { getAthletes, getTotalAthletes } from "@/services/consultant/consultant.services";

export async function GET(request: NextRequest) {
  try {

    const athletes = await getAthletes();
    const totalAthletes = await getTotalAthletes();

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