import type { AuthError, User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult =
  | { ok: true; data: { user: User; session: Session } }
  | { ok: false; error: { message: string; code?: string; status?: number } };

function toError(error: AuthError | Error): LoginResult {
  return {
    ok: false,
    error: {
      message: error.message,
      code: (error as any).code,
      status: (error as any).status,
    },
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const { email, password } = input;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return toError(error);

  if (!data.user || !data.session) {
    return {
      ok: false,
      error: { message: "Login failed. No session returned." },
    };
  }

  return {
    ok: true,
    data: { user: data.user, session: data.session },
  };
}
