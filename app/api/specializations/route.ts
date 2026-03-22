import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);


export async function GET() {
  try {
    const { data, error } = await supabase
      .from("consultants")
      .select("specialty")
      .not("specialty", "is", null);

    if (error) throw error;

    const unique = [
      ...new Set((data ?? []).map((r) => r.specialty as string)),
    ].sort();

    const specializations = unique.map((name, i) => ({ id: i + 1, name }));

    return NextResponse.json({ specializations });
  } catch (err: unknown) {
    console.error("[/api/specializations]", err);
    return NextResponse.json({ specializations: [] }, { status: 500 });
  }
}