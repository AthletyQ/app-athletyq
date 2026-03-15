import { NextRequest, NextResponse } from "next/server";
import { getConsultants } from "@/services/consultant/consultant.services";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  try {
    const result = await getConsultants({
      search:    searchParams.get("search")    || undefined,
      specialty: searchParams.get("specialty") || undefined,
      minPrice:  searchParams.get("minPrice")  ? Number(searchParams.get("minPrice"))  : undefined,
      maxPrice:  searchParams.get("maxPrice")  ? Number(searchParams.get("maxPrice"))  : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    // Surface the real error message so it's visible in the browser network tab
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/consultant]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}