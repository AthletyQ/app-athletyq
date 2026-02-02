import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createProfile } from "@/services/auth/auth.service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirect_to") || "/";

  if (!tokenHash || !type) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Missing token_hash or type parameter" },
      },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Supabase configuration missing" },
      },
      { status: 500 }
    );
  }

  // Create a Supabase client for server-side operations
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Verify the email confirmation token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email",
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: error.message, code: error.status?.toString() },
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "User not found after confirmation" },
        },
        { status: 400 }
      );
    }

    // Check if profile already exists (idempotency)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();

    // Create profile if it doesn't exist
    if (!existingProfile) {
      const profileResult = await createProfile(data.user.id, {
        fullName: data.user.user_metadata?.fullName,
        role: data.user.user_metadata?.role,
        email: data.user.email,
      });

      if (!profileResult.ok) {
        console.error("Failed to create profile:", profileResult.error);
        // Still redirect, but log the error
        // In production, you might want to handle this differently
      }
    }

    // Redirect to the specified URL or home page
    // In a real app, you might want to set a session cookie here
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("Email confirmation error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Internal server error during confirmation" },
      },
      { status: 500 }
    );
  }
}
