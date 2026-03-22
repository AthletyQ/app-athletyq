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

  if (!data.user.user_metadata?.role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    
    if (profile?.role) {
   
      data.user.user_metadata = {
        ...data.user.user_metadata,
        role: profile.role
      };
    }
  }

  return {
    ok: true,
    data: { user: data.user, session: data.session },
  };
}
