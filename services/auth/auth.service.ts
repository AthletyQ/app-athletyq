import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/server";

/* ─── Types ─── */
export type UserRole = "athlete" | "coach" | "wellness_professional";

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

  /* Consultant (wellness_professional) specific */
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

/**
 * Handles the signup flow:
 * 1. Creates the auth user in Supabase Auth
 * 2. Stores ALL signup data in user_metadata so it survives email confirmation
 *
 * Profile + actor-specific record are created AFTER email confirmation
 * via the /api/auth/create-profile handler.
 */
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

  // Store ALL form data in user_metadata — it will be available after
  // the user clicks the magic-link and we call create-profile.
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

  return {
    ok: true,
    data: {
      user: authData.user,
      confirmationRequired: !authData.session,
    },
  };
}