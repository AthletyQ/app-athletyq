import { NextRequest, NextResponse } from "next/server";
import { forgotPassword } from "@/services/auth/password-recovery.service";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: "Email is required" } },
        { status: 400 }
      );
    }

    // 1. Construct the Localhost link
    const localUrl = "http://localhost:3000";
    const localRedirect = `${localUrl}/reset-password`;

    // 2. Construct the Production link
    const prodUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get("host")}`;
    const prodRedirect = `${prodUrl}/reset-password`;

    // Trigger Supabase reset. 
    // Note: Supabase only sends ONE email per request. 
    // To show two buttons, we must ensure BOTH URLs are valid in Supabase Redirect allow-list.
    // We will send the Prod link as the primary 'redirectTo', 
    // but in your Supabase Email Template, you can now use both.
    
    const result = await forgotPassword(email, prodRedirect);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
