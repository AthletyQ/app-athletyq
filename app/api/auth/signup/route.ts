import { NextRequest, NextResponse } from "next/server";
import { signUp, type UserRole } from "@/services/auth/auth.service";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      age,
      heightCm,
      weightKg,
      preferredSportId,
      coachingSportId,
      specialization,
      yearsOfExperience,
      coachCertifications,
      consultantSpecialty,
      consultantCertifications,
    } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { ok: false, error: { message: "email, password, firstName, lastName, and role are required" } },
        { status: 400 },
      );
    }

    const validRoles: UserRole[] = ["athlete", "coach", "wellness_professional"];
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { ok: false, error: { message: `Invalid role. Must be one of: ${validRoles.join(", ")}` } },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid email format" } },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: { message: "Password must be at least 6 characters long" } },
        { status: 400 },
      );
    }

    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const emailRedirectTo = `${origin}/confirm`;

    const result = await signUp({
      email,
      password,
      firstName,
      lastName,
      phone: phone || "",
      role: role as UserRole,
      emailRedirectTo,
      age: age ? Number(age) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      preferredSportId: preferredSportId ? Number(preferredSportId) : undefined,
      coachingSportId: coachingSportId ? Number(coachingSportId) : undefined,
      specialization: specialization || undefined,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
      coachCertifications: coachCertifications || undefined,
      consultantSpecialty: consultantSpecialty || undefined,
      consultantCertifications: consultantCertifications || undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.status || 500 },
      );
    }

    const userId = result.data.user?.id;

    if (userId) {
      const supabaseAdmin = getSupabaseAdmin();
      const dbRole = role; 

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          role: dbRole,
          first_name: firstName,
          last_name: lastName,
          phone_number: phone || null,
        });

      if (profileError && profileError.code !== '23505') {
        console.error('Profile insert error:', profileError);
      }

      if (role === 'wellness_professional') {
        const { error } = await supabaseAdmin.from('consultants').insert({
          user_id: userId,
          specialty: consultantSpecialty || null,
          certifications: consultantCertifications ?? [],
        });
        if (error) console.error('Consultant insert error:', error);

      } else if (role === 'athlete') {
        const { error } = await supabaseAdmin.from('athletes').insert({
          user_id: userId,
          age: age ? Number(age) : null,
          height_cm: heightCm ? Number(heightCm) : null,
          weight_kg: weightKg ? Number(weightKg) : null,
          preferred_sport_id: preferredSportId ? Number(preferredSportId) : null,
        });
        if (error) console.error('Athlete insert error:', error);

      } else if (role === 'coach') {
        const { error } = await supabaseAdmin.from('coaches').insert({
          user_id: userId,
          coaching_sport_id: coachingSportId ? Number(coachingSportId) : null,
          specialization: specialization || null,
          years_of_experience: yearsOfExperience ? Number(yearsOfExperience) : null,
          certifications: coachCertifications ?? [],
        });
        if (error) console.error('Coach insert error:', error);
      }
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

