import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type SignUpInput = {
  email: string;
  password: string;
  /**
   * Optional email redirect URL for email confirmation flows.
   * If you use email confirmations, set this to something like `${origin}/auth/callback`.
   */
//   emailRedirectTo?: string;
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

function toServiceError(error: AuthError): AuthServiceResult<never> {
  return {
    ok: false,
    error: {
      message: error.message,
      code: (error as unknown as { code?: string }).code,
      status: error.status,
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
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
    };
  }

  const { email, password } = input;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
        emailRedirectTo: ''
    }
  });

  if (authError) return toServiceError(authError);

  return {
    ok: true,
    data: {
      user: authData.user,
      confirmationRequired: Boolean(authData.user && !authData.session),
    },
  };
}




