import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";


export type UserRole = "athlete" | "coach" | "wellness_professional";

export interface QualificationInput {
  title: string;
  institution: string;
  year: string;
}

export type SignUpInput = {

  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  emailRedirectTo?: string;


  age?: number;
  heightCm?: number;
  weightKg?: number;
  preferredSportId?: number;


  coachingSportId?: number;
  specialization?: string;
  yearsOfExperience?: number;
  coachCertifications?: string[];


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


function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && anonKey);
}

function toServiceError(error: AuthError | Error): AuthServiceResult<never> {
  const status = (error as { status?: number }).status;
  const code = (error as { code?: string }).code;

  return {
    ok: false,
    error: {
      message: error.message,
      code: typeof code === "string" ? code : undefined,
      status: typeof status === "number" ? status : undefined,
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