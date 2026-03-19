import { supabase } from "@/lib/supabase/client";
import type { AuthError } from "@supabase/supabase-js";

export type ForgotPasswordResult =
  | { ok: true; data: null }
  | { ok: false; error: { message: string; code?: string; status?: number } };

export type ResetPasswordResult =
  | { ok: true; data: null }
  | { ok: false; error: { message: string; code?: string; status?: number } };

function toError(error: AuthError | Error): { ok: false; error: { message: string; code?: string; status?: number } } {
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

export async function forgotPassword(email: string, redirectTo: string): Promise<ForgotPasswordResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) return toError(error);

  return { ok: true, data: null };
}

export async function resetPassword(password: string): Promise<ResetPasswordResult> {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) return toError(error);

  return { ok: true, data: null };
}
