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


    const localUrl = "http://localhost:3000";
    const localRedirect = `${localUrl}/reset-password`;

    const prodUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get("host")}`;
    const prodRedirect = `${prodUrl}/reset-password`;


    
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
