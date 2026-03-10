import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/auth/confirm
 *
 * Alternative email confirmation handler using token_hash query params.
 * After verifying the token, it creates the profile + actor record
 * via the same logic as create-profile, then redirects.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirect_to") || "/";

  if (!tokenHash || !type) {
    return NextResponse.json(
      { ok: false, error: { message: "Missing token_hash or type parameter" } },
      { status: 400 },
    );
  }

  try {

    const supabaseAdmin = getSupabaseAdmin();
    // Verify the email confirmation token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email",
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: { message: error.message } },
        { status: 400 },
      );
    }
    if (!data.user) {
      return NextResponse.json(
        { ok: false, error: { message: "User not found after confirmation" } },
        { status: 400 },
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!existingProfile) {
      const meta = data.user.user_metadata ?? {};

      // Insert profile
      await supabaseAdmin.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        role: meta.role,
        first_name: meta.firstName,
        last_name: meta.lastName,
        phone_number: meta.phone || null,
      });

      // Insert actor-specific record
      if (meta.role === "athlete") {
        await supabaseAdmin.from("athletes").insert({
          user_id: data.user.id,
          age: meta.age ? Number(meta.age) : null,
          height_cm: meta.heightCm ? Number(meta.heightCm) : null,
          weight_kg: meta.weightKg ? Number(meta.weightKg) : null,
          preferred_sport_id: meta.preferredSportId ? Number(meta.preferredSportId) : null,
        });
      } else if (meta.role === "coach") {
        await supabaseAdmin.from("coaches").insert({
          user_id: data.user.id,
          coaching_sport_id: meta.coachingSportId ? Number(meta.coachingSportId) : null,
          specialization: meta.specialization || null,
          years_of_experience: meta.yearsOfExperience ? Number(meta.yearsOfExperience) : null,
          certifications: meta.coachCertifications ?? [],
        });
      } else if (meta.role === "wellness_professional") {
        await supabaseAdmin.from("consultants").insert({
          user_id: data.user.id,
          specialty: meta.consultantSpecialty || null,
          certifications: meta.consultantCertifications ?? [],
        });
      }
    }

    // Redirect to the specified URL
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("Email confirmation error:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error during confirmation" } },
      { status: 500 },
    );
  }
}
