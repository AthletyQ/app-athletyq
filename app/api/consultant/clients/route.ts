import { NextRequest, NextResponse } from "next/server";
import { getConsultantClients } from "@/services/consultant/consultant.services";

export async function GET(request: NextRequest) {
  try {
    const consultantId = request.nextUrl.searchParams.get("consultant_id");

    if (!consultantId) {
      return NextResponse.json(
        { ok: false, error: { message: "consultant_id is required" } },
        { status: 400 }
      );
    }

    const clients = await getConsultantClients(consultantId);

    return NextResponse.json({ ok: true, data: { clients } });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}
