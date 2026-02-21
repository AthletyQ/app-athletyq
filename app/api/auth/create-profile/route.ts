import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/auth/create-profile
 *
 * Called from the client-side /confirm page after the magic-link is verified.
 * Inserts into `profiles` table + the actor-specific table
 * (`athletes`, `coaches`, or `consultants`).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing auth token" } },
        { status: 401 },
      );
    }

    // ── Verify the caller's token ──
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { ok: false, error: { message: "Invalid authentication token" } },
        { status: 401 },
      );
    }

    // ── Extract metadata stored during signup ──
    const meta = user.user_metadata ?? {};
    const role = meta.role as string | undefined;
    const firstName = meta.firstName as string | undefined;
    const lastName = meta.lastName as string | undefined;
    const phone = meta.phone as string | undefined;
    const email = user.email;

    if (!role || !firstName || !lastName || !email) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message:
              "Missing required profile data in user metadata (firstName, lastName, role, or email).",
          },
        },
        { status: 400 },
      );
    }

    const validRoles = ["athlete", "coach", "wellness_professional"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { ok: false, error: { message: `Invalid role: ${role} ` } },
        { status: 400 },
      );
    }

    // ── Idempotency: skip if profile already exists ──
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          ok: true,
          data: { id: user.id, message: "Profile already exists" },
        },
        { status: 200 },
      );
    }

    // ── Insert into `profiles` ──
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        email,
        role,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone || null,
      });

    if (profileError) {
      // Duplicate-key → profile already exists (race-condition safe)
      if (profileError.code === "23505") {
        return NextResponse.json(
          {
            ok: true,
            data: { id: user.id, message: "Profile already exists" },
          },
          { status: 200 },
        );
      }
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Failed to create profile",
            code: profileError.code,
            details: profileError.message,
          },
        },
        { status: 500 },
      );
    }

    // ── Insert into actor-specific table ──
    let actorError: any = null;

    if (role === "athlete") {
      const { error } = await supabaseAdmin.from("athletes").insert({
        user_id: user.id,
        age: meta.age ? Number(meta.age) : null,
        height_cm: meta.heightCm ? Number(meta.heightCm) : null,
        weight_kg: meta.weightKg ? Number(meta.weightKg) : null,
        preferred_sport_id: meta.preferredSportId
          ? Number(meta.preferredSportId)
          : null,
      });
      actorError = error;
    } else if (role === "coach") {
      const { error } = await supabaseAdmin.from("coaches").insert({
        user_id: user.id,
        coaching_sport_id: meta.coachingSportId
          ? Number(meta.coachingSportId)
          : null,
        specialization: meta.specialization || null,
        years_of_experience: meta.yearsOfExperience
          ? Number(meta.yearsOfExperience)
          : null,
        certifications: meta.coachCertifications ?? [],
      });
      actorError = error;
    } else if (role === "wellness_professional") {
      const { error } = await supabaseAdmin.from("consultants").insert({
        user_id: user.id,
        specialty: meta.consultantSpecialty || null,
        certifications: meta.consultantCertifications ?? [],
      });
      actorError = error;
    }

    if (actorError) {
      console.error(`Actor table insert error(${role}): `, actorError);
      // Profile was created successfully — log the actor error but don't fail
      // the whole request. The actor record can be populated later.
    }

    console.log("Profile + actor record created for:", user.id);

    return NextResponse.json(
      { ok: true, data: { id: user.id } },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create profile error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Internal server error", details: error.message },
      },
      { status: 500 },
    );
  }
}