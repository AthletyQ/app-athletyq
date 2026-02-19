import { NextRequest, NextResponse } from "next/server";
import { signUp, type UserRole } from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      /* Common */
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      /* Athlete */
      age,
      heightCm,
      weightKg,
      preferredSportId,
      /* Coach */
      coachingSportId,
      specialization,
      yearsOfExperience,
      coachCertifications,
      /* Consultant */
      consultantSpecialty,
      consultantCertifications,
    } = body;

    // ── Validate common required fields ──
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message:
              "email, password, firstName, lastName, and role are required",
          },
        },
        { status: 400 },
      );
    }

    // ── Validate role ──
    const validRoles: UserRole[] = ["athlete", "coach", "wellness_professional"];
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          },
        },
        { status: 400 },
      );
    }

    // ── Validate email format ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid email format" } },
        { status: 400 },
      );
    }

    // ── Validate password length ──
    if (password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Password must be at least 6 characters long" },
        },
        { status: 400 },
      );
    }

    // ── Build redirect URL for magic-link email ──
    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const emailRedirectTo = `${origin}/confirm`;

    // ── Call sign-up service ──
    const result = await signUp({
      email,
      password,
      firstName,
      lastName,
      phone: phone || "",
      role: role as UserRole,
      emailRedirectTo,
      // Athlete
      age: age ? Number(age) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      preferredSportId: preferredSportId ? Number(preferredSportId) : undefined,
      // Coach
      coachingSportId: coachingSportId ? Number(coachingSportId) : undefined,
      specialization: specialization || undefined,
      yearsOfExperience: yearsOfExperience
        ? Number(yearsOfExperience)
        : undefined,
      coachCertifications: coachCertifications || undefined,
      // Consultant
      consultantSpecialty: consultantSpecialty || undefined,
      consultantCertifications: consultantCertifications || undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.status || 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          userId: result.data.user?.id,
          email: result.data.user?.email,
          confirmationRequired: result.data.confirmationRequired,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid JSON in request body" } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
