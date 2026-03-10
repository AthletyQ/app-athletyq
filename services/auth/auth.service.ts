import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/* ─── Types ─── */
export type UserRole = "athlete" | "coach" | "consultant";

export interface QualificationInput {
  title: string;
  institution: string;
  year: string;
}

export type SignUpInput = {
  /* Common */
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  emailRedirectTo?: string;

  /* Athlete-specific */
  age?: number;
  heightCm?: number;
  weightKg?: number;
  preferredSportId?: number;

  /* Coach-specific */
  coachingSportId?: number;
  specialization?: string;
  yearsOfExperience?: number;
  coachCertifications?: string[];

  /* Consultant specific */
  consultantSpecialty?: string;
  consultantCertifications?: string[];
};

export type AuthServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string; status?: number } };

export type SignUpResult = {
  user: User | null;
  confirmationRequired: boolean;
};

/* ─── Helpers ─── */
function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && anonKey);
}

function toServiceError(error: AuthError | Error): AuthServiceResult<never> {
  return {
    ok: false,
    error: {
      message: error.message,
      code: (error as any).code,
      status: (error as any).status,
    },
  };
}

export async function signUp(
  input: SignUpInput,
): Promise<AuthServiceResult<SignUpResult>> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: {
        message:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      },
    };
  }

  const { email, password, emailRedirectTo, ...metadata } = input;

  // Step 1 — Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        email,
        ...metadata,
      },
    },
  });

  if (authError) return toServiceError(authError);
  if (!authData.user) {
    return {
      ok: false,
      error: { message: "Failed to create user account." },
    };
  }

  // Step 2 — Insert into profiles table immediately
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      role: input.role,
      first_name: input.firstName,
      last_name: input.lastName,
      phone_number: input.phone || null,
    });

  if (profileError && profileError.code !== '23505') {
    // 23505 = duplicate key, means profile already exists — safe to ignore
    console.error('Profile insert error:', profileError);
  }

  // Step 3 — Insert into role specific table
  if (input.role === 'consultant') {
    const { error } = await supabase.from('consultants').insert({
      user_id: authData.user.id,
      specialty: input.consultantSpecialty || null,
      certifications: input.consultantCertifications ?? [],
    });
    if (error) console.error('Consultant insert error:', error);

  } else if (input.role === 'athlete') {
    const { error } = await supabase.from('athletes').insert({
      user_id: authData.user.id,
      age: input.age ? Number(input.age) : null,
      height_cm: input.heightCm ? Number(input.heightCm) : null,
      weight_kg: input.weightKg ? Number(input.weightKg) : null,
      preferred_sport_id: input.preferredSportId ? Number(input.preferredSportId) : null,
    });
    if (error) console.error('Athlete insert error:', error);

  } else if (input.role === 'coach') {
    const { error } = await supabase.from('coaches').insert({
      user_id: authData.user.id,
      coaching_sport_id: input.coachingSportId ? Number(input.coachingSportId) : null,
      specialization: input.specialization || null,
      years_of_experience: input.yearsOfExperience ? Number(input.yearsOfExperience) : null,
      certifications: input.coachCertifications ?? [],
    });
    if (error) console.error('Coach insert error:', error);
  }

  return {
    ok: true,
    data: {
      user: authData.user,
      confirmationRequired: !authData.session,
    },
  };
}